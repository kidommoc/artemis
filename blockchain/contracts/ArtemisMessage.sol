// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract ArtemisMessage {
    struct Message {
        // 1 means Subscribing Request, 2 means Subscribing Response
        uint8 msgType;
        string content;
    }

    mapping(address to => Message[]) internal _messages;

    function sendMessage(address to, uint8 msgType, string calldata content) public {
        Message memory newMsg;
        newMsg.msgType = msgType;
        newMsg.content = content;
        _messages[to].push(newMsg);
    }

    function hasMessage() public view returns (bool result) {
        return _messages[msg.sender].length >= 0;
    }

    function fetchMessage() public view
        returns (uint8[] memory msgTypes, string[] memory msgContents)
    {
        Message[] storage msgs = _messages[msg.sender];
        uint8[] memory types = new uint8[](msgs.length);
        string[] memory contents = new string[](msgs.length);
        for (uint32 i = 0; i < msgs.length; ++i) {
            types[i] = msgs[i].msgType;
            contents[i] = msgs[i].content;
        }
        return (types, contents);
    }

    function clearMessage() public {
        delete _messages[msg.sender];
    }

}