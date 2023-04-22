// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract ArtemisMessage {
    struct Message {
        address sender;
        // 1 means Subscribing Request, 2 means Subscribing Response
        uint8 code;
        string content;
    }

    mapping(address receiver => Message[]) internal _messages;

    function sendMessage(address from, address to, uint8 code, string calldata content) public {
        Message memory message;
        message.sender = from;
        message.code = code;
        message.content = content;
        _messages[to].push(message);
    }

    function hasMessage() public view returns (bool result) {
        return _messages[msg.sender].length >= 0;
    }

    function fetchMessage() public view
        returns (address[] memory msgSenders, uint8[] memory msgCodes, string[] memory msgContents)
    {
        Message[] storage msgs = _messages[msg.sender];
        address[] memory senders = new address[](msgs.length);
        uint8[] memory codes = new uint8[](msgs.length);
        string[] memory contents = new string[](msgs.length);
        for (uint32 i = 0; i < msgs.length; ++i) {
            senders[i] = msgs[i].sender;
            codes[i] = msgs[i].code;
            contents[i] = msgs[i].content;
        }
        return (senders, codes, contents);
    }

    function clearMessage() public {
        delete _messages[msg.sender];
    }

}