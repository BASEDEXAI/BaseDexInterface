import { t } from "@lingui/macro";
import { InfoRow } from "components/InfoRow/InfoRow";
import {
  getMarket,
  getMarketName,
  getMarketPoolData,
  getOpenInterest,
  useMarketsData,
  useMarketsPoolsData,
} from "domain/synthetics/markets";
import { useOpenInterestData } from "domain/synthetics/markets/useOpenInterestData";
import {
  formatUsdAmount,
  getTokenData,
  getUsdFromTokenAmount,
  useAvailableTradeTokensData,
} from "domain/synthetics/tokens";
import { useChainId } from "lib/chains";

export type Props = {
  swapPath?: string[];
  marketAddress?: string;
  toTokenAddress?: string;
  fromTokenAddress?: string;
  indexTokenAddress?: string;
  isLong: boolean;
  isSwap: boolean;
};

export function MarketCard(p: Props) {
  const { chainId } = useChainId();

  const marketsData = useMarketsData(chainId);
  const poolsData = useMarketsPoolsData(chainId);
  const openInterestData = useOpenInterestData(chainId);
  const tokensData = useAvailableTradeTokensData(chainId);

  const market = getMarket(marketsData, p.marketAddress || p.swapPath?.[p.swapPath.length - 1]);
  const marketName = getMarketName(marketsData, tokensData, market?.marketTokenAddress);

  const pools = getMarketPoolData(poolsData, market?.marketTokenAddress);

  const longToken = getTokenData(tokensData, market?.longTokenAddress);
  const shortToken = getTokenData(tokensData, market?.shortTokenAddress);

  const longPoolAmount = pools?.longPoolAmount;

  const shortPoolAmount = pools?.shortPoolAmount;

  const longPoolAmountUsd = getUsdFromTokenAmount(tokensData, market?.longTokenAddress, longPoolAmount);

  const shortPoolAmountUsd = getUsdFromTokenAmount(tokensData, market?.shortTokenAddress, shortPoolAmount);

  const openInterest = getOpenInterest(openInterestData, market?.marketTokenAddress);

  function getTitle() {
    if (p.isSwap) {
      const toToken = getTokenData(tokensData, p.toTokenAddress);
      if (toToken) {
        return t`Swap to ${toToken?.symbol}`;
      }

      return t`Swap`;
    }

    const positionTypeText = p.isLong ? t`Long` : t`Short`;
    const indexToken = getTokenData(tokensData, p.indexTokenAddress);

    return t`${positionTypeText} ${indexToken?.symbol}`;
  }

  return (
    <div className="SwapMarketStats App-card">
      <div className="App-card-title">{getTitle()}</div>
      <div className="App-card-divider" />
      <div className="App-card-content">
        <InfoRow label={t`Market`} value={marketName || "..."} />

        {p.isSwap && (
          <>
            <InfoRow
              label={t`${longToken?.symbol} Pool Amount`}
              value={longPoolAmountUsd ? formatUsdAmount(longPoolAmountUsd) : "..."}
            />

            <InfoRow
              label={t`${shortToken?.symbol} Pool Amount`}
              value={shortPoolAmountUsd ? formatUsdAmount(shortPoolAmountUsd) : "..."}
            />
          </>
        )}

        {!p.isSwap && (
          <>
            <InfoRow label={t`Long Pool`} value={longPoolAmountUsd ? formatUsdAmount(longPoolAmountUsd) : "..."} />

            <InfoRow label={t`Short Pool`} value={shortPoolAmountUsd ? formatUsdAmount(shortPoolAmountUsd) : "..."} />

            <InfoRow
              label={t`Open Interest Long`}
              value={openInterest?.longInterest ? formatUsdAmount(openInterest.longInterest) : "..."}
            />

            <InfoRow
              label={t`Open Interest Short`}
              value={openInterest?.shortInterest ? formatUsdAmount(openInterest.shortInterest) : "..."}
            />
          </>
        )}
      </div>
    </div>
  );
}