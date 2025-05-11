import React from "react";
import { addons, types } from "storybook/internal/manager-api";

import { Panel } from "./components/Panel";
import { Tab } from "./components/Tab";
import { ADDON_ID, PANEL_ID, TAB_ID, TOOL_ID } from "./constants";
import { SearchBar } from "src/components/SearchBar";
/**
 * Note: if you want to use JSX in this file, rename it to `manager.tsx`
 * and update the entry prop in tsup.config.ts to use "src/manager.tsx",
 */

// Register the addon
addons.register(ADDON_ID, (api) => {
  // Register textsearch as tool
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: "My addon",
    render: () => <SearchBar />,
  });

  // Register a panel
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "My addon",
    match: ({ viewMode }) => viewMode === "story",
    render: ({ active }) => <Panel active={active} />,
  });

  // Register a tab
  addons.add(TAB_ID, {
    type: types.TAB,
    title: "My addon",
    render: ({ active }) => <Tab active={active} />,
  });
});
