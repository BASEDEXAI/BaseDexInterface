import { BigNumber } from "ethers";
import { TokenData } from "domain/synthetics/tokens";
import { Market } from "domain/synthetics/markets";
import { PositionUpdate } from "../../../context/SyntheticsEvents";

export type PositionFundingFees = {
  fundingFeeAmount: BigNumber;
  claimableLongTokenAmount: BigNumber;
  claimableShortTokenAmount: BigNumber;
  latestLongTokenFundingAmountPerSize: BigNumber;
  latestShortTokenFundingAmountPerSize: BigNumber;
  hasPendingLongTokenFundingFee: boolean;
  hasPendingShortTokenFundingFee: boolean;
};

export type Position = {
  key: string;
  account: string;
  marketAddress: string;
  collateralTokenAddress: string;
  sizeInUsd: BigNumber;
  sizeInTokens: BigNumber;
  collateralAmount: BigNumber;
  borrowingFactor: BigNumber;
  longTokenFundingAmountPerSize: BigNumber;
  shortTokenFundingAmountPerSize: BigNumber;
  increasedAtBlock: BigNumber;
  decreasedAtBlock: BigNumber;
  isLong: boolean;
  data: string;
  pendingBorrowingFees: BigNumber;
  pendingFundingFees: PositionFundingFees;
};

export type AggregatedPositionData = Position & {
  marketName?: string;
  market?: Market;
  indexToken?: TokenData;
  collateralToken?: TokenData;
  pnlToken?: TokenData;
  currentValueUsd?: BigNumber;
  collateralUsd?: BigNumber;
  averagePrice?: BigNumber;
  markPrice?: BigNumber;
  pnl?: BigNumber;
  pnlPercentage?: BigNumber;
  pnlAfterFees?: BigNumber;
  pnlAfterFeesPercentage?: BigNumber;
  collateralUsdAfterFees?: BigNumber;
  hasLowCollateral?: boolean;
  entryPrice?: BigNumber;
  netValue?: BigNumber;
  liqPrice?: BigNumber;
  leverage?: BigNumber;
  pendingFundingFeesUsd?: BigNumber;
  totalPendingFeesUsd?: BigNumber;
  pendingUpdate?: PositionUpdate;
  hasPendingChanges?: boolean;
  isOpening?: boolean;
};

export type PositionsData = {
  [positionKey: string]: Position;
};

export type AggregatedPositionsData = {
  [positionKey: string]: AggregatedPositionData;
};