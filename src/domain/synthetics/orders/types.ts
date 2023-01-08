import { BigNumber } from "ethers";
import { Market } from "domain/synthetics/markets";
import { TokenData } from "../tokens";

export enum OrderType {
  // the order will be cancelled if the minOutputAmount cannot be fulfilled
  MarketSwap,
  // @dev LimitSwap: swap token A to token B if the minOutputAmount can be fulfilled
  LimitSwap,
  // @dev MarketIncrease: increase position at the current market price
  // the order will be cancelled if the position cannot be increased at the acceptablePrice
  MarketIncrease,
  // @dev LimitIncrease: increase position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  LimitIncrease,
  // @dev MarketDecrease: decrease position at the curent market price
  // the order will be cancelled if the position cannot be decreased at the acceptablePrice
  MarketDecrease,
  // @dev LimitDecrease: decrease position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  LimitDecrease,
  // @dev StopLossDecrease: decrease position if the triggerPrice is reached and the acceptablePrice can be fulfilled
  StopLossDecrease,
  // @dev Liquidation: allows liquidation of positions if the criteria for liquidation are met
  Liquidation,
}

export type Order = {
  key: string;
  account: string;
  callbackContract: string;
  initialCollateralTokenAddress: string;
  marketAddress: string;
  receiver: string;
  swapPath: string[];
  contractAcceptablePrice: BigNumber;
  contractTriggerPrice: BigNumber;
  callbackGasLimit: BigNumber;
  executionFee: BigNumber;
  initialCollateralDeltaAmount: BigNumber;
  minOutputAmount: BigNumber;
  sizeDeltaUsd: BigNumber;
  updatedAtBlock: BigNumber;
  isFrozen: boolean;
  isLong: boolean;
  orderType: OrderType;
  shouldUnwrapNativeToken: boolean;
  data: string;
};

export type OrderTypeFlags = {
  isSwapOrder: boolean;
  isPositionOrder: boolean;
  isIncrease: boolean;
  isDecrease: boolean;
  isLimit: boolean;
  isStopTrigger: boolean;
};

export type AggregatedOrderData = Order & {
  title?: string;
  triggerPrice?: BigNumber;
  acceptablePrice?: BigNumber;
  market?: Market;
  marketName?: string;
  indexToken?: TokenData;
  initialCollateralToken?: TokenData;
  toCollateralToken?: TokenData;
};

export type OrdersData = {
  [orderKey: string]: Order;
};

export type AggregatedOrdersData = {
  [orderKey: string]: AggregatedOrderData;
};