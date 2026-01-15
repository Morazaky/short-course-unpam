// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    // owner contract
    address public owner;

    // saya ingin menyimpan sebuah nilai dalam bentuk uint256
    uint256 private storedValue;

    // state untuk menyimpan message
    string public message;

    // ketika ada update saya akan track perubahannya
    event ValueUpdated(uint256 newValue);
    
    // event ketika owner di-set
    event OwnerSet(address indexed oldOwner, address indexed newOwner);
    
    // event ketika message diupdate
    event MessageUpdated(string newMessage);

    // constructor untuk set owner saat deploy
    constructor() {
        owner = msg.sender;
        emit OwnerSet(address(0), msg.sender);
    }

    // modifier untuk memastikan hanya owner yang bisa akses
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // simpan nilai ke blockchain (write)
    function setValue(uint256 _value) public onlyOwner {
        storedValue = _value;
        emit ValueUpdated(_value);
    }

    // membaca nilai dari blockchain (read) terakhir kali di update
    function getValue() public view returns (uint256) {
        return storedValue;
    }

    // simpan message ke blockchain (write)
    function setMessage(string memory _message) public onlyOwner {
        message = _message;
        emit MessageUpdated(_message);
    }

    // membaca message dari blockchain (read)
    function getMessage() public view returns (string memory) {
        return message;
    }
}
