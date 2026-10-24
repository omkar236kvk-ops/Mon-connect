const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EventRegistry", () => {
  it("verified organizers create events, verified providers apply once, everyone else is rejected", async () => {
    const [deployer, organizer, provider, stranger] = await ethers.getSigners();
    const Nft = await ethers.getContractFactory("VerifiedNft");
    const orgNft = await Nft.deploy("Org", "ORG", deployer.address);
    const spNft = await Nft.deploy("SP", "SP", deployer.address);
    const reg = await (await ethers.getContractFactory("EventRegistry")).deploy(await orgNft.getAddress(), await spNft.getAddress());
    await orgNft.connect(organizer).safeMint(organizer.address);
    await spNft.connect(provider).safeMint(provider.address);
    const date = (await time.latest()) + 86400;

    await expect(reg.connect(organizer).createEvent("Tech Conf", "Om", "Catering", 500, date))
      .to.emit(reg, "EventCreated").withArgs(0, organizer.address, "Tech Conf");
    const [e] = await reg.getEvents();
    expect(e.organizer).to.equal(organizer.address);
    expect(e.attendees).to.equal(500);

    await expect(reg.connect(stranger).createEvent("X", "Y", "Z", 1, date)).to.be.revertedWith("Not a verified organizer");
    await expect(reg.connect(organizer).createEvent("", "Y", "Z", 1, date)).to.be.revertedWith("Field empty or too long");
    await expect(reg.connect(organizer).createEvent("X", "Y", "Z", 1, 1)).to.be.revertedWith("Event date must be in the future");

    // applying
    await expect(reg.connect(provider).applyToEvent(0)).to.emit(reg, "AppliedToEvent").withArgs(0, provider.address);
    expect(await reg.getApplicants(0)).to.deep.equal([provider.address]);
    expect(await reg.hasApplied(0, provider.address)).to.equal(true);
    await expect(reg.connect(provider).applyToEvent(0)).to.be.revertedWith("Already applied");
    await expect(reg.connect(organizer).applyToEvent(0)).to.be.revertedWith("Not a verified service provider");
    await expect(reg.connect(provider).applyToEvent(9)).to.be.revertedWith("No such event");

    await time.increaseTo(date + 1);
    await spNft.connect(stranger).safeMint(stranger.address);
    await expect(reg.connect(stranger).applyToEvent(0)).to.be.revertedWith("Event already started");
  });
});
