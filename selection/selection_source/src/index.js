import React from "react";
import ReactDOM from "react-dom";
import bridge from "@vkontakte/vk-bridge";
import App from "./App";
import {Page, Router} from '@happysanta/router';
import { RouterContext } from '@happysanta/router';
import { ConfigProvider } from '@happysanta/router';

export const PAGE_MENU = '/menu';
export const PAGE_PREVIEW = '/preview'

export const PANEL_MENU = 'panel_main';
export const PANEL_PREVIEW = 'panel_preview';

export const VIEW_MAIN = 'view_main';

const routes = {
  [PAGE_MENU]: new Page(PANEL_MENU, VIEW_MAIN),
  [PAGE_PREVIEW]: new Page(PANEL_PREVIEW, VIEW_MAIN),
};

export const router = new Router(routes);

router.start();

bridge.send("VKWebAppInit");

ReactDOM.render(<RouterContext.Provider value={router}>
  <App/>
</RouterContext.Provider>, document.getElementById('root'));
