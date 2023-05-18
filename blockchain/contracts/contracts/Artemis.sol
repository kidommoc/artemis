// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./ArtemisMessage.sol";

contract Artemis {
    event RegisterPublisherEvent(address addr, string name);
    event RenamePublisherEvent(address addr, string newName);
    event UploadArticleEvent(address publAddr, string fileAddr, string title, bool reqSubscribing, uint256 date);
    event RemoveArticleEvent(string fileAddr);

    struct Article {
        string title;
        address publAddr;
        uint256 date;
        bool requireSubscribing;
    }

    struct SubscribingInfo {
        uint256 time;
        uint256 requestTime;
        uint256 payment;
        uint256 requestedAt;
        string encryptedAESKey;
    }

    struct PublisherInfo {
        string name;
        string pubKey;
        uint256 subscribingPrice;
        mapping(address subscriber => SubscribingInfo) subscribers;
    }

    struct SubscriberInfo {
        uint256 lastTrimmedAt;
        uint256 length;
        address[] publs;
    }

    ArtemisMessage internal _message;
    mapping(address publisher => PublisherInfo) internal _publs;
    mapping(address subscriber => SubscriberInfo) internal _subs;
    mapping(string fileAddr => Article) internal _articles;

    constructor(address msgAddr) {
        _message = ArtemisMessage(msgAddr);
    }

    function registerPublisher(string calldata name, string calldata pubKey, uint price) public {
        require(bytes(_publs[msg.sender].name).length == 0, "already registered!");
        require(bytes(name).length != 0, "empty name!");
        require(bytes(pubKey).length != 0, "empty public key!");
        if (price < 0)
            price = 0;
        _publs[msg.sender].name = name;
        _publs[msg.sender].pubKey = pubKey;
        _publs[msg.sender].subscribingPrice = price;
        emit RegisterPublisherEvent(msg.sender, name);
    }

    function getPublisherName(address publ) public view returns (string memory name) {
        require(publ != address(0), "empty publisher address!");
        require(bytes(_publs[publ].name).length >= 0, "not a publisher!");
        return _publs[publ].name;
    }

    function renamePublisher(string calldata name) public {
        require(bytes(name).length != 0, "empty name!");
        _publs[msg.sender].name = name;
        emit RenamePublisherEvent(msg.sender, name);
    }

    function getPublisherPubKey(address publ) public view returns (string memory pubKey) {
        require(publ != address(0), "empty publisher address!");
        require(bytes(_publs[publ].name).length >= 0, "not a publisher!");
        return _publs[publ].pubKey;
    }

    function setSubscribingPrice(uint price) public {
        require(bytes(_publs[msg.sender].name).length >= 0, "not a publisher!");
        if (price < 0)
            price = 0;
        _publs[msg.sender].subscribingPrice = price;
    }
    
    function getSubscribingPrice(address publ) public view returns (uint256 price) {
        require(publ != address(0), "empty publisher address!");
        require(bytes(_publs[publ].name).length >= 0, "not a publisher!");
        return _publs[publ].subscribingPrice;
    }

    // 0: not subscribing, 1: requesting, 2: subscribing, 3: discarded
    function getSubscribingStatus() public view returns (address[] memory publ, uint8[] memory status, uint256[] memory time) {
        SubscriberInfo storage subscriber = _subs[msg.sender];
        status = new uint8[](subscriber.length);
        time = new uint256[](subscriber.length);
        for (uint256 i = 0; i < subscriber.length; ++i) {
            address publAddr = subscriber.publs[i];
            SubscribingInfo storage info = _publs[publAddr].subscribers[msg.sender];
            if (info.time > block.timestamp) {
                status[i] = 2;
                time[i] = info.time;
            }
            else {
                if (info.requestTime > 0) {
                    if (info.requestedAt + 15 days < block.timestamp)
                        status[i] = 3;
                    else
                        status[i] = 1;
                }
                else
                    status[i] = 0;
            }
        }
        return (subscriber.publs, status, time);
    }

    function subscribe(address payable publ, uint months, string calldata pubKey) public payable {
        require(publ != address(0), "empty publisher address!");
        require(bytes(_publs[publ].name).length >= 0, "not a publisher!");
        PublisherInfo storage publInfo = _publs[publ];
        SubscribingInfo storage subsInfo = publInfo.subscribers[msg.sender];
        if (subsInfo.requestTime > 0)
            revert("dunplicated requesting!");
        require(months > 0, "invalid months!");
        require(msg.value >= publInfo.subscribingPrice * months, "insufficient payment!");
        // being subscribing now?
        if (subsInfo.time == 0 || subsInfo.time < block.timestamp) { // no
            subsInfo.requestTime = months * 30 days;
            subsInfo.requestedAt = block.timestamp;
            subsInfo.payment = msg.value;
            SubscriberInfo storage info = _subs[msg.sender];
            ++info.length;
            info.publs.push(publ);
            _message.sendMessage(msg.sender, publ, 1, pubKey); // 1 means SUB_REQ
        }
        else { // yes
            subsInfo.time += months * 30 days;
            publ.transfer(msg.value);
        }
    }

    function admitSubscribing(address subs, string calldata encKey) public {
        require(subs != address(0), "empty subscriber address!");
        require(bytes(encKey).length != 0, "empty Encryted AES Key!");
        SubscribingInfo storage info = _publs[msg.sender].subscribers[subs];
        require(info.requestTime != 0, "havn't subscribed or already discarded!");
        info.encryptedAESKey = encKey;
        info.time = block.timestamp + info.requestTime;
        payable(msg.sender).transfer(info.payment);
        delete info.requestTime;
        delete info.requestedAt;
        delete info.payment;
        _message.sendMessage(msg.sender, subs, 2, "OK"); // 2 means SUB_RES
    }

    function discardSubscribing(address publ) public {
        require(publ != address(0), "empty publisher address!");
        require(bytes(_publs[publ].name).length >= 0, "not a publisher!");
        SubscribingInfo storage info = _publs[publ].subscribers[msg.sender];
        payable(msg.sender).transfer(info.payment);
        delete info.requestTime;
        delete info.requestedAt;
        delete info.payment;
    }

    function trimSubscribing() public {
        SubscriberInfo storage subs = _subs[msg.sender];
        require(subs.lastTrimmedAt == 0 || subs.lastTrimmedAt + 1 weeks > block.timestamp, "too frequent!");
        for (uint256 i = 0; i < subs.length; ++i) {
            SubscribingInfo storage info = _publs[subs.publs[i]].subscribers[msg.sender];
            if (info.time < block.timestamp && info.requestTime == 0) {
                subs.publs[i] = subs.publs[subs.length - 1];
                --subs.length;
            }
        }
    }

    function getSubscribingTime(address publ) public view returns (uint256 time) {
        require(publ != address(0), "empty publisher address!");
        require(bytes(_publs[publ].name).length >= 0, "not a publisher!");
        uint256 t = _publs[publ].subscribers[msg.sender].time;
        if (t < block.timestamp)
            return 0;
        return t;
    }

    function uploadArticle(string calldata file, string calldata title, bool reqSubscribing) public {
        require(bytes(_publs[msg.sender].name).length != 0, "not a publisher!");
        require(bytes(file).length != 0, "empty article location!");
        require(_articles[file].publAddr == address(0), "article exists!");
        require(bytes(title).length != 0, "empty title!");
        _articles[file].title = title;
        _articles[file].publAddr = msg.sender;
        _articles[file].date = block.timestamp;
        _articles[file].requireSubscribing = reqSubscribing;
        emit UploadArticleEvent(msg.sender, file, title, reqSubscribing, block.timestamp);
    }

    function removeArticle(string calldata file) public {
        require(bytes(file).length != 0, "empty article location!");
        require(msg.sender == _articles[file].publAddr, "not article owner!");
        delete _articles[file];
        emit RemoveArticleEvent(file);
    }

    function getArticleInfo(string calldata file) public view
        returns (string memory title, address publAddr, string memory publisher, uint256 date, bool requireSubscribing)
    {
        require(bytes(file).length != 0, "empty article location!");
        Article storage a = _articles[file];
        require(a.publAddr != address(0), "article doesn't exist!");
        PublisherInfo storage p = _publs[a.publAddr];
        return (a.title, a.publAddr, p.name, a.date, a.requireSubscribing);
    }

    function accessArticle(string calldata file) public view returns (bool permission, string memory encKey) {
        require(bytes(file).length != 0, "empty article location!");
        Article storage a = _articles[file];
        require(a.publAddr != address(0), "article doesn't exist!");
        if (!a.requireSubscribing)
            return (true, "");
        if (a.publAddr == msg.sender)
            return (true, "ME");
        PublisherInfo storage publInfo = _publs[a.publAddr];
        if (publInfo.subscribers[msg.sender].time < block.timestamp)
            return (false, "");
        return (true, publInfo.subscribers[msg.sender].encryptedAESKey);
    }
}