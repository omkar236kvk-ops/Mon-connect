// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title EventRegistry
 * @notice On-chain list of organizer events. Only holders of the organizer VerifiedNft can create one;
 * only holders of the service-provider VerifiedNft can apply. Everyone can read events and applicants.
 * Hiring an applicant happens in ChainConnectV2 (escrow), so nothing here moves funds.
 * Deployed separately from ChainConnectV2 so adding it doesn't wipe vendors or escrows.
 */
contract EventRegistry {
    struct EventInfo {
        uint256 id;
        address organizer;
        string name;
        string organizerName;
        string serviceNeeded;
        uint256 attendees;
        uint256 eventDate; // unix seconds
        uint256 createdAt;
    }

    uint256 private constant MAX_FIELD_LEN = 256;

    IERC721 public immutable organizerNft;
    IERC721 public immutable serviceProviderNft;
    EventInfo[] private events;
    mapping(uint256 => address[]) private applicants;
    mapping(uint256 => mapping(address => bool)) public hasApplied;

    event EventCreated(uint256 indexed id, address indexed organizer, string name);
    event AppliedToEvent(uint256 indexed id, address indexed provider);

    constructor(address _organizerNft, address _serviceProviderNft) {
        require(_organizerNft != address(0) && _serviceProviderNft != address(0), "Invalid NFT");
        organizerNft = IERC721(_organizerNft);
        serviceProviderNft = IERC721(_serviceProviderNft);
    }

    function createEvent(
        string calldata _name,
        string calldata _organizerName,
        string calldata _serviceNeeded,
        uint256 _attendees,
        uint256 _eventDate
    ) external returns (uint256 id) {
        require(organizerNft.balanceOf(msg.sender) > 0, "Not a verified organizer");
        _checkLen(_name);
        _checkLen(_organizerName);
        _checkLen(_serviceNeeded);
        require(_attendees > 0, "Attendees must be > 0");
        require(_eventDate > block.timestamp, "Event date must be in the future");

        id = events.length;
        events.push(EventInfo(id, msg.sender, _name, _organizerName, _serviceNeeded, _attendees, _eventDate, block.timestamp));
        emit EventCreated(id, msg.sender, _name);
    }

    function applyToEvent(uint256 _id) external {
        require(_id < events.length, "No such event");
        require(serviceProviderNft.balanceOf(msg.sender) > 0, "Not a verified service provider");
        require(events[_id].eventDate > block.timestamp, "Event already started");
        require(!hasApplied[_id][msg.sender], "Already applied");
        hasApplied[_id][msg.sender] = true;
        applicants[_id].push(msg.sender);
        emit AppliedToEvent(_id, msg.sender);
    }

    // ponytail: returns every event in one call; add paging if the list grows past a few hundred.
    function getEvents() external view returns (EventInfo[] memory) {
        return events;
    }

    function getApplicants(uint256 _id) external view returns (address[] memory) {
        return applicants[_id];
    }

    function _checkLen(string calldata s) private pure {
        uint256 len = bytes(s).length;
        require(len > 0 && len <= MAX_FIELD_LEN, "Field empty or too long");
    }
}
