import SEO from "components/Common/SEO";
import { getPageTitle } from "lib/legacy";
import Tab from "components/Tab/Tab";
import { IndividualLeaderboard } from "components/Leaderboard/IndividualLeaderboard";
import { useLocalStorage } from "react-use";
import { getCurrentCompetitionIndex, LEADERBOARD_SELECTED_TAB_KEY } from "domain/leaderboard/constants";
import Loader from "components/Common/Loader";
import { TeamLeaderboard } from "components/Leaderboard/TeamLeaderboard";
import { Trans } from "@lingui/macro";
import { useChainId } from "lib/chains";
import { getChainIcon } from "config/chains";

import "./Leaderboard.css";
import { useCompetition } from "domain/leaderboard/useCompetition";

export default function Leaderboard() {
  const { chainId } = useChainId();
  const { exists: competitionExists, loading } = useCompetition(chainId, getCurrentCompetitionIndex(chainId));

  const tabOptions = ["Individuals"];
  const [activeTab, setActiveTab] = useLocalStorage(LEADERBOARD_SELECTED_TAB_KEY, tabOptions[0]);

  if (!loading && competitionExists) {
    tabOptions.push("Teams");
  } else if (!loading && !competitionExists && activeTab !== tabOptions[0]) {
    setActiveTab(tabOptions[0]);
  }

  const handleTabChange = (option) => {
    setActiveTab(option);
  };

  return (
    <SEO title={getPageTitle("Leaderboards")}>
      <div className="default-container page-layout Leaderboard">
        <div className="section-title-block-wrapper">
          <div className="section-title-block">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Leaderboards</Trans> <img alt="Chain Icon" src={getChainIcon(chainId)} />
              </div>
              <div className="Page-description">
                Addresses trading statistics. Choose between general or competitions leaderboards.
              </div>
            </div>
          </div>
        </div>
        {loading && <Loader />}
        {!loading && (
          <>
            {tabOptions.length <= 1 || (
              <div className="Leaderboard-tabs-container">
                <Tab options={tabOptions} option={activeTab} onChange={handleTabChange} className="Leaderboard-tabs" />
              </div>
            )}
            {activeTab === tabOptions[0] && <IndividualLeaderboard />}
            {activeTab === tabOptions[1] && <TeamLeaderboard competitionIndex={getCurrentCompetitionIndex(chainId)} />}
          </>
        )}
      </div>
    </SEO>
  );
}
