import {Page, Router} from '@happysanta/router';

export const PAGE_MENU = '/menu';

export const PANEL_MENU = 'panel_main';

export const VIEW_MAIN = 'view_main';

const routes = {
  [PAGE_MENU]: new Page(PANEL_MENU, VIEW_MAIN),
};

export const router = new Router(routes);

router.start();