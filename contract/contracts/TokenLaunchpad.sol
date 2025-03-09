// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Token.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";

// Deploying TokenLaunchpad contract...

// Deployment Summary:
// -------------------
// TokenLaunchpad deployed to: 0xc43B901F4F7cA41293E6Df723F428136211a6D5e


contract TokenLaunchpad {
    event TokenSupplyDetails(uint256 currentSupply, uint256 maxSupply, uint256 availableQty);
    event EthRequired(uint256 requiredEth);
    event LiquidityPoolCreated(address pool);
    event LiquidityProvided(uint256 liquidity);
    event UserBalance(address indexed user, uint256 balance);
    event AvailableQuantity(uint256 availableQty);
    event LPTokensBurned(uint256 liquidity);

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

    address constant UNISWAP_V2_FACTORY_ADDRESS = 0xF62c03E08ada871A0bEb309762E260a7a6a880E6;
    address constant UNISWAP_V2_ROUTER_ADDRESS = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;

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
        return (INITIAL_PRICE * 10**18 * (exp1 - exp2)) / K;
    }
    
    function exp
    (uint256 x) 
    internal 
    pure 
    returns(uint256) 
    {
        uint256 sum = 10**18;
        uint256 term = 10**18;
        uint256 xPower = x;

        for(uint256 i = 1; i <= 20; i++){
            term = (term * xPower) / (i * 10**18);
            sum += term;
            if (term < 1) break;
        }
        return sum;
    }

    function createMemeToken(
        string memory name,
        string memory symbol,
        string memory imageUrl,
        string memory description
    ) 
    public 
    payable 
    returns(address) 
    {
        require(msg.value >= MEMETOKEN_CREATION_PLATFORM_FEE, "Fee not paid for creation");
        Token ct = new Token(name, symbol, INITIAL_SUPPLY);
        address memeTokenAddress = address(ct);
        memeToken memory newlyCreatedToken = memeToken(
            name,
            symbol,
            description,
            imageUrl,
            0,
            memeTokenAddress,
            msg.sender
        );
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

        require(listedToken.fundingRaised <= MEMETOKEN_FUNDING_GOAL, "Funding goal already reached");

        uint currentSupply = memeTokenCt.totalSupply();
        uint available_qty = MAX_SUPPLY - currentSupply;
        
        emit TokenSupplyDetails(currentSupply, MAX_SUPPLY, available_qty);

        uint scaled_available_qty = available_qty / DECIMALS;
        uint tokenQty_scaled = tokenQty * DECIMALS;
        require(tokenQty <= scaled_available_qty, "Exceeds available tokens");

        uint currentSupplyScaled = (currentSupply - INITIAL_SUPPLY) / DECIMALS; 
        uint requiredEth = calculateCost(currentSupplyScaled, tokenQty);
        
        emit EthRequired(requiredEth);
        require(msg.value >= requiredEth, "Insufficient ETH");

        listedToken.fundingRaised += msg.value;

        if(listedToken.fundingRaised >= MEMETOKEN_FUNDING_GOAL) {
            address pool = _createLiquidityPool(memeTokenAddress);
            emit LiquidityPoolCreated(pool);

            uint tokenAmount = INITIAL_SUPPLY;
            uint ethAmount = listedToken.fundingRaised;
            uint liquidity = _provideLiquidity(memeTokenAddress, tokenAmount, ethAmount);
            emit LiquidityProvided(liquidity);

            _burnLpTokens(pool, liquidity);   
        }

        memeTokenCt.mint(tokenQty_scaled, msg.sender);
        emit UserBalance(msg.sender, memeTokenCt.balanceOf(msg.sender));
        emit AvailableQuantity(MAX_SUPPLY - memeTokenCt.totalSupply());

        return 1;
    }

    function _createLiquidityPool
    (address memeTokenAddress) 
    internal 
    returns(address) 
    {
        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY_ADDRESS);
        return factory.createPair(memeTokenAddress, IUniswapV2Router01(UNISWAP_V2_ROUTER_ADDRESS).WETH());
    }

    function _provideLiquidity
    (address memeTokenAddress, uint tokenAmount, uint ethAmount) 
    internal 
    returns(uint) 
    {
        Token memeTokenCt = Token(memeTokenAddress);
        memeTokenCt.approve(UNISWAP_V2_ROUTER_ADDRESS, tokenAmount);
        (,,uint liquidity) = IUniswapV2Router01(UNISWAP_V2_ROUTER_ADDRESS).addLiquidityETH{
            value: ethAmount
        }(memeTokenAddress, tokenAmount, tokenAmount, ethAmount, address(this), block.timestamp);
        return liquidity;
    }

    function _burnLpTokens
    (address pool, uint liquidity) 
    internal 
    returns(uint) 
    {
        IUniswapV2Pair(pool).transfer(address(0), liquidity);
        emit LPTokensBurned(liquidity);
        return 1;
    }
}