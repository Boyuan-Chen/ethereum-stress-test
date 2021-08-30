const ethers = require('ethers');
const { Watcher } = require('@eth-optimism/watcher');

const sampleJson = require("./artifacts-ovm/contracts/Sample.sol/Sample.json");
const Lib_AddressManagerJson = require("./Lib_AddressManager.json");
const OVM_L1StandardBridgeJson = require("./OVM_L1StandardBridge.json");

const L1_NODE_WEB3_URL = "https://rinkeby.infura.io/v3/KEY";
const L1Web3 = new ethers.providers.JsonRpcProvider(L1_NODE_WEB3_URL);

const L2_NODE_WEB3_URL = "https://rinkeby-integration.boba.network";
const L2Web3 = new ethers.providers.JsonRpcProvider(L2_NODE_WEB3_URL);

const pk1 = ""
const pk2 = ""
const pk3 = "";
const pk4 = "";
const pk5 = "";

const Lib_AddressManagerAddress = "0x4e57A993D14FF6f2BCA23d9B174faA9c7AdC4A5A"

const depositERC20 = async (pk) => {
  // get address
  const Lib_AddressManager = new ethers.Contract(
    Lib_AddressManagerAddress,
    Lib_AddressManagerJson.abi,
    L1Web3
  )
  const Proxy__OVM_L1StandardBridgeAddress = await Lib_AddressManager.getAddress("Proxy__OVM_L1StandardBridge")
  const Proxy__OVM_L1CrossDomainMessengerAddress = await Lib_AddressManager.getAddress("Proxy__OVM_L1CrossDomainMessenger")
  console.log(`Proxy__OVM_L1StandardBridgeAddress: ${Proxy__OVM_L1StandardBridgeAddress}`)
  console.log(`Proxy__OVM_L1CrossDomainMessengerAddress: ${Proxy__OVM_L1CrossDomainMessengerAddress}`)

  const watcher = new Watcher({
    l1: {
      provider: L1Web3,
      messengerAddress: Proxy__OVM_L1CrossDomainMessengerAddress,
    },
    l2: {
      provider: L2Web3,
      messengerAddress: "0x4200000000000000000000000000000000000007",
    },
  })

  const L1Wallet = new ethers.Wallet(pk).connect(L1Web3)

  const L1StandardERC20 = new ethers.Contract(
    Proxy__OVM_L1StandardBridgeAddress,
    OVM_L1StandardBridgeJson.abi,
    L1Wallet,
  )
  const depositTxStatus = await L1StandardERC20.depositETH(
    9999999,
    ethers.utils.formatBytes32String(new Date().getTime().toString()),
    { value: ethers.utils.parseEther('0.1') }
  )
  await depositTxStatus.wait()

  const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(depositTxStatus.hash)
  console.log(' got L1->L2 message hash', l1ToL2msgHash)
  const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
  console.log(' completed Deposit! L2 tx hash:', l2Receipt.transactionHash)
}

const deployStressTest = async (pk) => {
  const L2Wallet = new ethers.Wallet(pk).connect(L2Web3);
  const Factory__sampleContract = new ethers.ContractFactory(
    sampleJson.abi,
    sampleJson.bytecode,
    L2Wallet
  )
  const sampleContract = await Factory__sampleContract.deploy()
  await sampleContract.deployTransaction.wait()
  return sampleContract.address
}

const txStressTest = async (pk, address) => {
  const L2Wallet = new ethers.Wallet(pk).connect(L2Web3);
  const sampleContract = new ethers.Contract(
    address,
    sampleJson.abi,
    L2Wallet
  )
  let i = 0;
  while (i < 100) {
    try {
      const tx = await sampleContract.add();
      await tx.wait();
      console.log(`Ran tx test ${L2Wallet.address} time ${i}`)
    } catch {
      console.log(`Failed to run tx test ${L2Wallet.address} time ${i}`);
    }
    i++;
  }
}

const onrampStressTest = async (pk) => {
  const L1Wallet = new ethers.Wallet(pk).connect(L1Web3);
  // get address
  const Lib_AddressManager = new ethers.Contract(
    Lib_AddressManagerAddress,
    Lib_AddressManagerJson.abi,
    L1Web3
  )
  const Proxy__OVM_L1StandardBridgeAddress = await Lib_AddressManager.getAddress("Proxy__OVM_L1StandardBridge")
  const L1StandardERC20 = new ethers.Contract(
    Proxy__OVM_L1StandardBridgeAddress,
    OVM_L1StandardBridgeJson.abi,
    L1Wallet,
  )
  let i = 0;
  while (i < 100) {
    try {
      const depositTxStatus = await L1StandardERC20.depositETH(
        9999999,
        ethers.utils.formatBytes32String(new Date().getTime().toString()),
        { value: ethers.utils.parseEther('0.00000001') }
      )
      await depositTxStatus.wait()
      console.log(`Ran onramp test ${L1Wallet.address} time ${i}`)
    } catch {
      console.log(`Failed to run onramp test ${L1Wallet.address} time ${i}`);
    }
    i++;
  }
}

const main = async () => {
  // deposit ETH from L1 to L2
  await depositERC20(pk1)
  await depositERC20(pk2)
  await depositERC20(pk3)
  await depositERC20(pk4)
  await depositERC20(pk5)
  // deploy stress test
  const stressTestAddress = await deployStressTest(pk1);
  txStressTest(pk1, stressTestAddress).then(() => console.log(`Finished tx test ${pk1}!`))
  txStressTest(pk2, stressTestAddress).then(() => console.log(`Finished tx test ${pk2}!`))
  txStressTest(pk3, stressTestAddress).then(() => console.log(`Finished tx test ${pk3}!`))
  txStressTest(pk4, stressTestAddress).then(() => console.log(`Finished tx test ${pk4}!`))
  txStressTest(pk5, stressTestAddress).then(() => console.log(`Finished tx test ${pk5}!`))
  // onramp test
  onrampStressTest(pk1).then(() => console.log(`Finished onramp test ${pk1}!`))
  onrampStressTest(pk2).then(() => console.log(`Finished onramp test ${pk2}!`))
  onrampStressTest(pk3).then(() => console.log(`Finished onramp test ${pk3}!`))
  onrampStressTest(pk4).then(() => console.log(`Finished onramp test ${pk4}!`))
  onrampStressTest(pk5).then(() => console.log(`Finished onramp test ${pk5}!`))
}

main()