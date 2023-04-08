// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./ArtemisMessage.sol";

contract Artemis {
    struct Article {
        address authorAddr;
        string title;
        string author;
        bool requireSubscribing;
    }

    struct SubscribeInfo {
        uint256 time;
        uint256 requestTime;
        uint256 payment;
        string encryptedAESKey;
    }

    struct DistributorInfo {
        uint subscribePrice;
        mapping(address subscriber => SubscribeInfo) subscribers;
    }

    ArtemisMessage internal _message;
    mapping(address distributor => DistributorInfo) internal _dists;
    mapping(string fileAddr => Article) internal _articles;

    constructor(address msgAddr) {
        _message = ArtemisMessage(msgAddr);
    }

    function setSubscribingPrice(uint price) public {
        DistributorInfo storage dist = _dists[msg.sender];
        dist.subscribePrice = price;
    }
    
    function getSubscribingPrice(address dist) public view returns (uint) {
        return _dists[dist].subscribePrice;
    }

    function subscribe(address payable dist, uint months, string calldata pubKey) public payable {
        require(dist != address(0), "empty distributor address!");
        DistributorInfo storage distInfo = _dists[dist];
        require(msg.value >= months * distInfo.subscribePrice, "insufficiently paying!");
        SubscribeInfo storage subInfo = distInfo.subscribers[msg.sender];
        // being subscribing now?
        if (subInfo.time == 0 || subInfo.time < block.timestamp) {
            // no
            _message.sendMessage(dist, 1, pubKey); // 1 means SUB_REQ
            subInfo.requestTime = block.timestamp + months*30 days + 1 days;
            subInfo.payment = msg.value;
        }
        else {
            // yes
            subInfo.time += months*30 days + 1 days;
            dist.transfer(msg.value);
        }
    }

    function admitSubscribing(address subscriber, string calldata encKey) public {
        require(subscriber != address(0), "empty subscriber address!");
        require(bytes(encKey).length != 0, "empty Encryted AES Key!");
        SubscribeInfo storage info = _dists[msg.sender].subscribers[subscriber];
        _message.sendMessage(subscriber, 2, "OK");
        info.encryptedAESKey = encKey;
        info.time = info.requestTime;
        payable(msg.sender).transfer(info.payment);
        delete info.requestTime;
        delete info.payment;
    }

    function uploadArticle(string calldata file, string calldata title, string calldata author, bool requireSubscribing) public {
        require(bytes(file).length != 0, "empty article location!");
        require(_articles[file].authorAddr == address(0), "article exists!");
        require(bytes(title).length != 0, "empty title!");
        require(bytes(author).length != 0, "empty author!");
        _articles[file].title = title;
        _articles[file].author = author;
        _articles[file].authorAddr = msg.sender;
        _articles[file].requireSubscribing = requireSubscribing;
    }

    function removeArticle(string calldata file) public {
        require(bytes(file).length != 0, "empty article location!");
        require(msg.sender == _articles[file].authorAddr, "not article owner!");
        delete _articles[file];
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
        DistributorInfo storage distInfo = _dists[a.authorAddr];
        if (distInfo.subscribers[msg.sender].time < block.timestamp)
            return (false, "");
        return (true, distInfo.subscribers[msg.sender].encryptedAESKey);
    }
}