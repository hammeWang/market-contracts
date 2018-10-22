const SettingsRegistry = artifacts.require('SettingsRegistry');
const AuctionSettingIds = artifacts.require('AuctionSettingIds');
const MysteriousTreasure = artifacts.require('MysteriousTreasure');
const GenesisHolder = artifacts.require('GenesisHolder')
const LandBase = artifacts.require('LandBase');
const ObjectOwnership = artifacts.require('ObjectOwnership');
const ClockAuction = artifacts.require('ClockAuction')
const Proxy = artifacts.require('OwnedUpgradeabilityProxy');
const LandBaseAuthority = artifacts.require('LandBaseAuthority');
const RevenuePool = artifacts.require('RevenuePool');
const SmartTokenAuthority = artifacts.require('SmartTokenAuthority');
const TradingRewardPoolAuthority = artifacts.require('TradingRewardPoolAuthority');
const TradingRewardPool = artifacts.require('TradingRewardPool');

// bancor related
const StandardERC223 = artifacts.require('StandardERC223');
// const RING = artifacts.require('ERC223SmartToken');
const BancorConverter = artifacts.require('BancorConverter');
const BancorFormula = artifacts.require('BancorFormula');
const BancorGasPriceLimit = artifacts.require('BancorGasPriceLimit');
const EtherToken = artifacts.require('EtherToken');
const ContractFeatures = artifacts.require('ContractFeatures');
const WhiteList = artifacts.require('Whitelist');
const BancorNetwork = artifacts.require('BancorNetwork');
const BancorExchange = artifacts.require('BancorExchange');
const ContractIds = artifacts.require('ContractIds');
const FeatureIds = artifacts.require('FeatureIds');



var conf = {
    //addresses
    registry_address: '0xf21930682df28044d88623e0707facf419477041',
    ring_address: '0xf8720eb6ad4a530cccb696043a0d10831e2ff60e',
    landBaseProxy_address: '0x342a453e3fcbc68e3d0c7d03f44a4179a6c5071a',
    objectOwnershipProxy_address: '0x0ce6fe3b598ece2b9cb026943ad3e2df41450481',
    bancorExchange_address: '0x146ce62cfb2cc353a09b20efeac35de1261db495',
    kton_address: '0x8db914ef206c7f6c36e5223fce17900b587f46d2',
    bankProxy_address: '0x33dcd37b0b7315105859f9aa4b603339ad8825fc',

    // 4%
    uint_auction_cut: 400,
    // 20%
    uint_referer_cut: 2000,
    // 30 minutes
    uint_bid_waiting_time: 1800,
    from: '0x4cc4c344eba849dc09ac9af4bff1977e44fc1d7e',
    uint_error_space: 0
}

let clockAuctionProxy_address;
let mysteriousTreasureProxy_address;
let genesisHolderProxy_address;
let revenuePoolProxy_address;
let pointsRewardPoolProxy_address;


module.exports = function (deployer, network) {
    if (network == 'kovan') {

        deployer.deploy(TradingRewardPoolAuthority);
        deployer.deploy(SmartTokenAuthority);
        deployer.deploy(AuctionSettingIds);
        deployer.deploy(LandBaseAuthority);
        deployer.deploy(Proxy)
        .then(async () => {
            let clockAuctionProxy = await Proxy.deployed();
            clockAuctionProxy_address = clockAuctionProxy.address;
            console.log("ClockAuctionProxy_address: ", clockAuctionProxy_address);
            await deployer.deploy(ClockAuction);
            return deployer.deploy(Proxy);
        }).then(async () => {
            let mysteriousTreasureProxy = await Proxy.deployed();
            mysteriousTreasureProxy_address = mysteriousTreasureProxy.address;
            console.log("mysteriousTreasureProxy_address: ", mysteriousTreasureProxy_address);
            await deployer.deploy(MysteriousTreasure);
            return deployer.deploy(Proxy)
        }).then(async () => {
            let genesisHolderProxy  = await Proxy.deployed();
            genesisHolderProxy_address = genesisHolderProxy.address;
            console.log("genesisHolderProxy_address: ", genesisHolderProxy_address);
            await deployer.deploy(GenesisHolder);
            return deployer.deploy(Proxy)
        }).then(async () => {
            let revenuePoolProxy = await Proxy.deployed();
            revenuePoolProxy_address = revenuePoolProxy.address;
            console.log("revenuePoolProxy_address: ", revenuePoolProxy_address);
            await deployer.deploy(RevenuePool);
            return deployer.deploy(Proxy)
        }).then(async() => {
            let pointsRewardPoolProxy = await Proxy.deployed();
            pointsRewardPoolProxy_address = pointsRewardPoolProxy.address;
            console.log("pointsRewardPoolProxy_address: ", pointsRewardPoolProxy_address);
            await deployer.deploy(TradingRewardPool);
        }).then(async () => {

            // let ring = await RING.at(conf.ring_address);
            let registry = await SettingsRegistry.at(conf.registry_address);
            let settingIds = await AuctionSettingIds.deployed();

            //register to registry
            let tradingRewardPoolId = await settingIds.CONTRACT_POINTS_REWARD_POOL.call();
            await registry.setAddressProperty(tradingRewardPoolId,pointsRewardPoolProxy_address);

            let ringId = await settingIds.CONTRACT_RING_ERC20_TOKEN.call();
            await registry.setAddressProperty(ringId, conf.ring_address);

            let auctionId = await settingIds.CONTRACT_CLOCK_AUCTION.call();
            await registry.setAddressProperty(auctionId, clockAuctionProxy_address);

            let auctionCutId = await settingIds.UINT_AUCTION_CUT.call();
            await registry.setUintProperty(auctionCutId, conf.uint_auction_cut);

            let waitingTimeId = await settingIds.UINT_AUCTION_BID_WAITING_TIME.call();
            await registry.setUintProperty(waitingTimeId, conf.uint_bid_waiting_time);

            let treasureId = await settingIds.CONTRACT_MYSTERIOUS_TREASURE.call();
            await registry.setAddressProperty(treasureId, mysteriousTreasureProxy_address);

            let bancorExchangeId = await settingIds.CONTRACT_BANCOR_EXCHANGE.call();
            await registry.setAddressProperty(bancorExchangeId, conf.bancorExchange_address);

            let refererCutId = await settingIds.UINT_REFERER_CUT.call();
            await registry.setUintProperty(refererCutId, conf.uint_referer_cut);

            let poolId = await settingIds.CONTRACT_REVENUE_POOL.call();
            await registry.setAddressProperty(poolId, revenuePoolProxy_address);

            let errorSpaceId = await settingIds.UINT_EXCHANGE_ERROR_SPACE.call();
            await registry.setUintProperty(errorSpaceId, conf.uint_error_space);

            console.log("REGISTRATION DONE! ");

            // upgrade
            await Proxy.at(clockAuctionProxy_address).upgradeTo(ClockAuction.address);
            await Proxy.at(mysteriousTreasureProxy_address).upgradeTo(MysteriousTreasure.address);
            await Proxy.at(genesisHolderProxy_address).upgradeTo(GenesisHolder.address);
            await Proxy.at(revenuePoolProxy_address).upgradeTo(RevenuePool.address);
            await Proxy.at(pointsRewardPoolProxy_address).upgradeTo(TradingRewardPool.address);
            console.log("UPGRADE DONE! ");

            // initialize
            let clockAuctionProxy = await ClockAuction.at(clockAuctionProxy_address);
            await clockAuctionProxy.initializeContract(conf.objectOwnershipProxy_address, genesisHolderProxy_address, conf.registry_address);

            let genesisHolderProxy = await GenesisHolder.at(genesisHolderProxy_address);
            await genesisHolderProxy.initializeContract(conf.registry_address, conf.ring_address);

            let mysteriousTreasureProxy = await MysteriousTreasure.at(mysteriousTreasureProxy_address);
            await mysteriousTreasureProxy.initializeContract(conf.registry_address, [10439, 419, 5258, 12200, 12200]);

            let revenuePoolProxy = await RevenuePool.at(revenuePoolProxy_address);
            await revenuePoolProxy.initializeContract(conf.registry_address);

            let pointsRewardPoolProxy = await TradingRewardPool.at(pointsRewardPoolProxy_address);
            await pointsRewardPoolProxy.initializeContract(conf.registry_address);
            console.log("INITIALIZATION DONE! ");

            // allow treasure to modify data in landbase
            let landBaseAuthority = await LandBaseAuthority.deployed();
            await landBaseAuthority.setWhitelist(mysteriousTreasureProxy_address, true);
            await LandBase.at(conf.landBaseProxy_address).setAuthority(landBaseAuthority.address);

            // allow revenuePool to modify data in tradingRewardPool
            let tradingRewardPoolAuthority = await TradingRewardPoolAuthority.deployed();
            await tradingRewardPoolAuthority.setWhitelist(revenuePoolProxy.address, true);
            await pointsRewardPoolProxy.setAuthority(tradingRewardPoolAuthority.address);

            // transfer treasure's owner to clockAuction
            await mysteriousTreasureProxy.transferOwnership(clockAuctionProxy_address);

            // register in genesisHolder
            await genesisHolderProxy.registerToken(conf.kton_address);

            // set kton's authority to genesisHolder
            let ktonAuthority = await SmartTokenAuthority.deployed();
            await ktonAuthority.setWhitelist(conf.bankProxy_address, true);
            await ktonAuthority.setWhitelist(genesisHolderProxy_address, true);
            await StandardERC223.at(conf.kton_address).setAuthority(ktonAuthority.address);

            console.log("MIGRATE SUCCESSFULLY! ")

        })


    }
}





