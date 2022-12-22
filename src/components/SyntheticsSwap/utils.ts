import { t } from "@lingui/macro";
import { HIGH_PRICE_IMPACT_BP } from "config/synthetics";
import { NATIVE_TOKEN_ADDRESS, getWrappedToken } from "config/tokens";
import {
  ExecutionFeeParams,
  PriceImpact,
  getExecutionFee,
  getPriceImpact,
  usePriceImpactConfigs,
} from "domain/synthetics/fees";
import { getMarkets, getOpenInterest, useMarketsData } from "domain/synthetics/markets";
import { useOpenInterestData } from "domain/synthetics/markets/useOpenInterestData";
import {
  TokensData,
  adaptToInfoTokens,
  convertFromUsdByPrice,
  convertToUsdByPrice,
  getTokenData,
  useAvailableTradeTokensData,
} from "domain/synthetics/tokens";
import { Token } from "domain/tokens";
import { BigNumber } from "ethers";

import longImg from "img/long.svg";
import shortImg from "img/short.svg";
import swapImg from "img/swap.svg";
import { useChainId } from "lib/chains";
import { BASIS_POINTS_DIVISOR, PRECISION, USD_DECIMALS, adjustForDecimals } from "lib/legacy";
import { parseValue } from "lib/numbers";
import { useMemo, useState } from "react";

export enum Operation {
  Long = "Long",
  Short = "Short",
  Swap = "Swap",
}

export enum Mode {
  Market = "Market",
  Limit = "Limit",
  Trigger = "Trigger",
}

export const operationTexts = {
  [Operation.Long]: t`Long`,
  [Operation.Short]: t`Short`,
  [Operation.Swap]: t`Swap`,
};

export const operationIcons = {
  [Operation.Long]: longImg,
  [Operation.Short]: shortImg,
  [Operation.Swap]: swapImg,
};

export const modeTexts = {
  [Mode.Market]: t`Market`,
  [Mode.Limit]: t`Limit`,
  [Mode.Trigger]: t`Trigger`,
};

export const avaialbleModes = {
  [Operation.Long]: [Mode.Market, Mode.Limit],
  [Operation.Short]: [Mode.Market, Mode.Limit],
  [Operation.Swap]: [Mode.Market, Mode.Limit],
};

const TRIGGER_RATIO_PRECISION = PRECISION;
const LEVERAGE_PRECISION = BigNumber.from(BASIS_POINTS_DIVISOR);

export function getSubmitError(p: {
  operationType: Operation;
  mode: Mode;
  tokensData: TokensData;
  fromTokenAddress?: string;
  fromTokenAmount?: BigNumber;
  toTokenAddress?: string;
  swapPath?: string[];
  isHighPriceImpact?: boolean;
  isHighPriceImpactAccepted?: boolean;
}) {
  const fromToken = getTokenData(p.tokensData, p.fromTokenAddress);

  if (!fromToken) {
    return t`Loading...`;
  }

  if (p.fromTokenAmount?.gt(fromToken.balance || BigNumber.from(0))) {
    return t`Insufficient ${fromToken.symbol} balance`;
  }

  if (p.operationType === Operation.Swap) {
    if (p.fromTokenAddress === p.toTokenAddress) {
      return t`Select different tokens`;
    }
  }

  if (!p.fromTokenAmount?.gt(0)) {
    return t`Enter an amount`;
  }

  if (!p.swapPath) {
    return t`Couldn't find a swap path`;
  }

  if (p.isHighPriceImpact && !p.isHighPriceImpactAccepted) {
    return t`Need to accept price impact`;
  }
}

export function getNextTokenAmount(p: {
  fromTokenAmount: BigNumber;
  fromTokenPrice: BigNumber;
  fromToken: Token;
  toToken: Token;
  toTokenPrice: BigNumber;
  triggerPrice?: BigNumber;
  isInvertedTriggerPrice?: boolean;
  swapTriggerRatio?: BigNumber;
  isInvertedTriggerRatio?: boolean;
  leverageMultiplier?: BigNumber;
  isInvertedLeverage?: boolean;
}) {
  const fromUsd = convertToUsdByPrice(p.fromTokenAmount, p.fromToken.decimals, p.fromTokenPrice);

  let toAmount = convertFromUsdByPrice(fromUsd, p.toToken.decimals, p.toTokenPrice);

  if (!toAmount || !fromUsd) return undefined;

  if (p.swapTriggerRatio?.gt(0)) {
    const ratio = p.isInvertedTriggerRatio
      ? TRIGGER_RATIO_PRECISION.mul(TRIGGER_RATIO_PRECISION).div(p.swapTriggerRatio)
      : p.swapTriggerRatio;

    const adjustedDecimalsRatio = adjustForDecimals(ratio, p.fromToken.decimals, p.toToken.decimals);

    toAmount = p.fromTokenAmount.mul(adjustedDecimalsRatio).div(TRIGGER_RATIO_PRECISION);
  } else if (p.triggerPrice?.gt(0)) {
    if (p.isInvertedTriggerPrice) {
      const toTriggerUsd = convertToUsdByPrice(p.fromTokenAmount, p.fromToken.decimals, p.triggerPrice);

      toAmount = convertFromUsdByPrice(toTriggerUsd, p.toToken.decimals, p.toTokenPrice);
    } else {
      toAmount = convertFromUsdByPrice(fromUsd, p.toToken.decimals, p.triggerPrice);
    }
  }

  if (p.leverageMultiplier) {
    const leverage = p.isInvertedLeverage
      ? LEVERAGE_PRECISION.mul(LEVERAGE_PRECISION).div(p.leverageMultiplier)
      : p.leverageMultiplier;

    toAmount = toAmount?.mul(leverage).div(LEVERAGE_PRECISION);
  }

  return toAmount;
}

export type SwapTriggerRatioState = {
  inputValue: string;
  setInputValue: (v: string) => void;
  ratio: BigNumber;
  biggestSide: "from" | "to";
  markRatio: BigNumber;
};

export function useSwapTriggerRatioState(p: {
  isAllowed: boolean;
  fromTokenPrice?: BigNumber;
  toTokenPrice?: BigNumber;
}): SwapTriggerRatioState | undefined {
  const [inputValue, setInputValue] = useState("");

  if (!p.isAllowed || !p.fromTokenPrice || !p.toTokenPrice) return undefined;

  const ratio = parseValue(inputValue || "0", USD_DECIMALS)!;

  const biggestSide = p.fromTokenPrice.gt(p.toTokenPrice) ? "from" : "to";

  let markRatio =
    biggestSide === "from"
      ? p.fromTokenPrice.mul(PRECISION).div(p.toTokenPrice)
      : p.toTokenPrice.mul(PRECISION).div(p.fromTokenPrice);

  return {
    inputValue,
    setInputValue,
    ratio,
    biggestSide,
    markRatio,
  };
}

export function useAvailableSwapTokens(p: { indexTokenAddress?: string; isSwap: boolean }) {
  const { chainId } = useChainId();

  const marketsData = useMarketsData(chainId);
  const tokensData = useAvailableTradeTokensData(chainId);

  const wrappedToken = getWrappedToken(chainId);
  const markets = getMarkets(marketsData);

  const infoTokens = useMemo(() => adaptToInfoTokens(tokensData), [tokensData]);

  const { longCollaterals, shortCollaterals, indexTokens, indexCollateralsMap } = useMemo(() => {
    const longMap: { [address: string]: Token } = {};
    const shortMap: { [address: string]: Token } = {};
    const indexMap: { [address: string]: Token } = {};

    const indexCollateralsMap: { [indexAddress: string]: { [collateral: string]: Token } } = {};

    for (const market of markets) {
      const longToken = getTokenData(tokensData, market.longTokenAddress)!;
      const shortToken = getTokenData(tokensData, market.shortTokenAddress)!;
      const indexToken = getTokenData(tokensData, market.indexTokenAddress)!;

      longMap[longToken.address] = longToken;
      shortMap[shortToken.address] = shortToken;
      indexMap[indexToken.address] = indexToken;

      if (longToken.address === NATIVE_TOKEN_ADDRESS) {
        longMap[wrappedToken.address] = wrappedToken;
      }

      if (shortToken.address === NATIVE_TOKEN_ADDRESS) {
        shortMap[wrappedToken.address] = wrappedToken;
      }

      indexCollateralsMap[indexToken.address] = indexCollateralsMap[indexToken.address] || {};
      indexCollateralsMap[indexToken.address][longToken.address] = longToken;
      indexCollateralsMap[indexToken.address][shortToken.address] = shortToken;
    }

    return {
      longCollaterals: Object.values(longMap) as Token[],
      shortCollaterals: Object.values(shortMap) as Token[],
      indexTokens: Object.values(indexMap) as Token[],
      indexCollateralsMap,
    };
  }, [markets, tokensData, wrappedToken]);

  const availableFromTokens: Token[] = longCollaterals.concat(shortCollaterals);
  const availableToTokens: Token[] = p.isSwap ? availableFromTokens : indexTokens;

  const availableCollaterals =
    !p.isSwap && p.indexTokenAddress
      ? (Object.values(indexCollateralsMap[p.indexTokenAddress] || {}) as Token[])
      : undefined;

  return {
    availableFromTokens,
    availableToTokens,
    availableCollaterals,
    infoTokens,
  };
}

export type Fees = {
  executionFee?: ExecutionFeeParams;
  totalFeeUsd: BigNumber;
  positionPriceImpact?: PriceImpact;
  isHighPriceImpactAccepted?: boolean;
  isHighPriceImpact?: boolean;
  setIsHighPriceImpactAccepted?: (v: boolean) => void;
};

export function useFeesState(p: {
  isSwap: boolean;
  marketAddress?: string;
  isLong: boolean;
  sizeDeltaUsd?: BigNumber;
}): Fees {
  const { chainId } = useChainId();

  const [isHighPriceImpactAccepted, setIsHighPriceImpactAccepted] = useState(false);

  const tokensData = useAvailableTradeTokensData(chainId);
  const openInterestData = useOpenInterestData(chainId);
  const priceImpactConfigs = usePriceImpactConfigs(chainId);

  const executionFee = getExecutionFee(tokensData);

  if (p.isSwap) {
    const totalFeeUsd = BigNumber.from(0).sub(executionFee?.feeUsd || BigNumber.from(0));

    // todo: swap fees
    return {
      executionFee,
      totalFeeUsd,
    };
  }

  const openInterest = getOpenInterest(openInterestData, p.marketAddress);

  const currentLong = openInterest?.longInterest;
  const currentShort = openInterest?.shortInterest;

  const longDeltaUsd = p.isLong ? p.sizeDeltaUsd : BigNumber.from(0);
  const shortDeltaUsd = p.isLong ? BigNumber.from(0) : p.sizeDeltaUsd;

  const positionPriceImpact = getPriceImpact(
    priceImpactConfigs,
    p.marketAddress,
    currentLong,
    currentShort,
    longDeltaUsd,
    shortDeltaUsd
  );

  const totalFeeUsd = BigNumber.from(0)
    .sub(executionFee?.feeUsd || BigNumber.from(0))
    .add(positionPriceImpact?.impact || BigNumber.from(0));

  const isHighPriceImpact =
    positionPriceImpact?.impact.lt(0) && positionPriceImpact?.basisPoints.gte(HIGH_PRICE_IMPACT_BP);

  return {
    executionFee,
    totalFeeUsd,
    positionPriceImpact,
    isHighPriceImpact,
    isHighPriceImpactAccepted,
    setIsHighPriceImpactAccepted,
  };
}