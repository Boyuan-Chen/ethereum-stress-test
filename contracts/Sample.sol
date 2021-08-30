// SPDX-License-Identifier: MIT
pragma solidity >0.5.0;

contract Sample {
    uint256 public countNumber;

    function add() public {
        countNumber += 1;
    }
}