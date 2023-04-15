// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./ArtemisMessage.sol";

contract Artemis {
    event UploadArticleEvent(string fileAddr, string title, string author, address authorAddr, bool reqSubscribing, uint256 date);
    event RemoveArticleEvent(string fileAddr);

    struct Article {
        address authorAddr;
        string title;
        string author;
        uint256 date;
        bool requireSubscribing;
    }

    struct SubscribeInfo {
        uint256 time;
        uint256 requestTime;
        uint256 payment;
        string encryptedAESKey;
    }

    struct PublisherInfo {
        string pubKey;
        uint subscribingPrice;
        mapping(address subscriber => SubscribeInfo) subscribers;
    }

    ArtemisMessage internal _message;
    mapping(address publisher => PublisherInfo) internal _publs;
    mapping(string fileAddr => Article) internal _articles;

    constructor(address msgAddr) {
        _message = ArtemisMessage(msgAddr);
    }

    function registerPublisher(string calldata pubKey, uint price) public {
        require(bytes(pubKey).length != 0, "empty public key!");
        if (price < 0)
            price = 0;
        _publs[msg.sender].pubKey = pubKey;
        _publs[msg.sender].subscribingPrice = price;
    }

    function getPublisherPubKey(address publisher) public view returns (string memory pubKey) {
        require(publisher != address(0), "empty publisher address!");
        return _publs[publisher].pubKey;
    }

    function setSubscribingPrice(uint price) public {
        if (price < 0)
            price = 0;
        _publs[msg.sender].subscribingPrice = price;
    }
    
    function getSubscribingPrice(address publ) public view returns (uint) {
        return _publs[publ].subscribingPrice;
    }

    function subscribe(address payable publ, uint months, string calldata pubKey) public payable {
        require(publ != address(0), "empty publisher address!");
        PublisherInfo storage publInfo = _publs[publ];
        require(msg.value >= months * publInfo.subscribingPrice, "insufficiently paying!");
        SubscribeInfo storage subInfo = publInfo.subscribers[msg.sender];
        // being subscribing now?
        if (subInfo.time == 0 || subInfo.time < block.timestamp) {
            // no
            _message.sendMessage(publ, 1, pubKey); // 1 means SUB_REQ
            subInfo.requestTime = block.timestamp + months*30 days + 1 days;
            subInfo.payment = msg.value;
        }
        else {
            // yes
            subInfo.time += months*30 days + 1 days;
            publ.transfer(msg.value);
        }
    }

    function admitSubscribing(address subscriber, string calldata encKey) public {
        require(subscriber != address(0), "empty subscriber address!");
        require(bytes(encKey).length != 0, "empty Encryted AES Key!");
        SubscribeInfo storage info = _publs[msg.sender].subscribers[subscriber];
        _message.sendMessage(subscriber, 2, "OK");
        info.encryptedAESKey = encKey;
        info.time = info.requestTime;
        payable(msg.sender).transfer(info.payment);
        delete info.requestTime;
        delete info.payment;
    }

    function getSubscribingTime(address publ) public view returns (uint time) {
        require(publ != address(0), "empty publisher address!");
        return _publs[publ].subscribers[msg.sender].time;
    }

    function uploadArticle(string calldata file, string calldata title, string calldata author, bool reqSubscribing) public {
        require(bytes(file).length != 0, "empty article location!");
        require(_articles[file].authorAddr == address(0), "article exists!");
        require(bytes(title).length != 0, "empty title!");
        require(bytes(author).length != 0, "empty author!");
        _articles[file].title = title;
        _articles[file].author = author;
        _articles[file].authorAddr = msg.sender;
        _articles[file].date = block.timestamp;
        _articles[file].requireSubscribing = reqSubscribing;
        emit UploadArticleEvent(file, title, author, msg.sender, reqSubscribing, block.timestamp);
    }

    function removeArticle(string calldata file) public {
        require(bytes(file).length != 0, "empty article location!");
        require(msg.sender == _articles[file].authorAddr, "not article owner!");
        delete _articles[file];
        emit RemoveArticleEvent(file);
    }

    function getArticleInfo(string calldata file) public view
        returns (address authorAddr, string memory title, string memory author, bool requireSubscribing)
    {
        require(bytes(file).length != 0, "empty article location!");
        Article storage a = _articles[file];
        require(a.authorAddr != address(0), "article doesn't exist!");
        return (a.authorAddr, a.title, a.author, a.requireSubscribing);
    }

    function accessArticle(string calldata file) public view returns (bool permission, string memory encKey) {
        require(bytes(file).length != 0, "empty article location!");
        Article storage a = _articles[file];
        require(a.authorAddr != address(0), "article doesn't exist!");
        if (!a.requireSubscribing)
            return (true, "");
        PublisherInfo storage publInfo = _publs[a.authorAddr];
        if (publInfo.subscribers[msg.sender].time < block.timestamp)
            return (false, "");
        return (true, publInfo.subscribers[msg.sender].encryptedAESKey);
    }
}