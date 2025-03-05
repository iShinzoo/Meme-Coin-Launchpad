// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Token.sol";
import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";

contract TokenLaunchpad {

    struct memeToken {
        string name;
        string symbol;
        string description;
        string tokenImageUrl;
        uint fundingRaised;
        address tokenAddress;
        address creatorAddress;
    }

    address[] public memeTokenAddresses;

    mapping(address => memeToken) public addressToMemeTokenMapping;

    uint constant MEMETOKEN_CREATION_PLATFORM_FEE = 0.0001 ether;
    uint constant MEMECOIN_FUNDING_DEADLINE_DURATION = 10 days;
    uint constant MEMETOKEN_FUNDING_GOAL = 24 ether;

    address constant UNISWAP_V2_FACTORY_ADDRESS = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant UNISWAP_V2_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    uint constant DECIMALS = 10 ** 18;
    uint constant MAX_SUPPLY = 1000000 * DECIMALS;
    uint constant INITIAL_SUPPLY = 20 * MAX_SUPPLY / 100;

    uint256 public constant INITIAL_PRICE = 30000000000000;
    uint256 public constant K = 8 * 10**15;

    function calculateCost
    (uint256 currentSupply, uint256 tokensToBuy)
    public
    pure
    returns(uint256)
    {
        uint256 exponent1 = (K * (currentSupply + tokensToBuy)) / 10**18;
        uint256 exponent2 = (K * currentSupply) / 10**18;

        uint256 exp1 = exp(exponent1);
        uint256 exp2 = exp(exponent2);

        uint256 cost = (INITIAL_PRICE * 10**18 * (exp1 - exp2)) / K;
        return cost;
    }
    
    function exp
    (uint256 x)
    internal
    pure
    returns(uint256)
    {
        uint256 sum = 10**18;
        uint256 term = 10**18;
        uint256  xPower = x;

        for(uint256 i = 1; i <= 20; i++){
            term = (term * xPower) / (i * 10**18);
            sum += term;

            if (term < 1) break;
        }

        return sum;
    }

    function createMemeToken
    (string memory name, string memory symbol, string memory imageUrl, string memory description)
    public
    payable
    returns(address)
    {
        require(msg.value >= MEMETOKEN_CREATION_PLATFORM_FEE, "Fee not paid for creation");
        Token ct = new Token(name, symbol, INITIAL_SUPPLY);
        address memeTokenAddress = address(ct);
        memeToken memory  newlyCreatedToken = memeToken(name, symbol, description, imageUrl, 0, memeTokenAddress, msg.sender);
        memeTokenAddresses.push(memeTokenAddress);
        addressToMemeTokenMapping[memeTokenAddress] = newlyCreatedToken;
        return memeTokenAddress;
    }

    function getAllMemeTokens()
    public
    view
    returns(memeToken[] memory)
    {
        memeToken[] memory allTokens = new memeToken[](memeTokenAddresses.length);
        for (uint i = 0; i < memeTokenAddresses.length; i++) {
            allTokens[i] = addressToMemeTokenMapping[memeTokenAddresses[i]];
        }
        return allTokens;
    }

    function buyMemeToken
    (address memeTokenAddress, uint tokenQty)
    public
    payable
    returns(uint)
    {
        require(addressToMemeTokenMapping[memeTokenAddress].tokenAddress != address(0), "Token is not listed yet");
        memeToken storage listedToken = addressToMemeTokenMapping[memeTokenAddress];

        Token memeTokenCt = Token(memeTokenAddress);

        require(listedToken.fundingRaised <= MEMETOKEN_FUNDING_GOAL, "Funding goal has already been raised!");

        uint currentSupply = memeTokenCt.totalSupply();
        console.log("Current supply of token is: ", currentSupply);
        console.log("Max Supply of token is: ", MAX_SUPPLY);
        uint available_qty = MAX_SUPPLY - currentSupply;
        console.log("Available qty of token is: ", available_qty);

        uint scaled_avialable_qty = available_qty / DECIMALS;
        uint tokenQty_scaled = tokenQty * DECIMALS;

        require(tokenQty <= scaled_avialable_qty, "You cannot buy more tokens than available");

        uint currentSupplyScaled = (currentSupply - INITIAL_SUPPLY) / DECIMALS; 
        uint requiredEth = calculateCost(currentSupplyScaled, tokenQty);

        console.log("Eth required to buy tokens is: ", requiredEth);

        require(msg.value >= requiredEth, "Not enough ETH");

        listedToken.fundingRaised += msg.value;

        if(listedToken.fundingRaised >= MEMETOKEN_FUNDING_GOAL){
            address pool = _createLiquidityPool(memeTokenAddress);
            console.log("Liquidity pool created: ", pool);

            uint tokenAmout = INITIAL_SUPPLY;
            uint ethAmount = listedToken.fundingRaised;
            uint liquidity = _provideLiquidity(memeTokenAddress, tokenAmout, ethAmount);
            console.log("Liquidity provided: ", liquidity);

            _burnLpTokens(pool, liquidity);   
        }

        memeTokenCt.mint(tokenQty_scaled, msg.sender);

        console.log("User balance of the token is :", memeTokenCt.balanceOf(msg.sender));
        console.log("New Avialable Quantity :", MAX_SUPPLY - memeTokenCt.totalSupply());

        return 1;
    }

    function _createLiquidityPool
    (address memeTokenAddress)
    internal
    returns(address)
    {
        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY_ADDRESS);
        IUniswapV2Router01 router = IUniswapV2Router01(UNISWAP_V2_ROUTER_ADDRESS);
        address pair = factory.createPair(memeTokenAddress, router.WETH());
        return pair;
    }

    function _provideLiquidity
    (address memeTokenAddress, uint tokenAmount, uint ethAmount)
    internal
    returns(uint)
    {
        Token memeTokenCt = Token(memeTokenAddress);
        memeTokenCt.approve(UNISWAP_V2_ROUTER_ADDRESS, tokenAmount);
        IUniswapV2Router01 router = IUniswapV2Router01(UNISWAP_V2_ROUTER_ADDRESS);
        (uint amountToken, uint amountETH, uint liqiidity) = router.addLiquidityETH{
            value: ethAmount
        }(memeTokenAddress, tokenAmount, tokenAmount, ethAmount, address(this), block.timestamp);
        return liqiidity;
    }

    function _burnLpTokens
    (address pool, uint liquidity)
    internal
    returns(uint)
    {
        IUniswapV2Pair uniswapv2pairct = IUniswapV2Pair(pool);
        uniswapv2pairct.transfer(address(0), liquidity);
        console.log("Uniswap v2 tokens burnt");
        return 1;
    }
}