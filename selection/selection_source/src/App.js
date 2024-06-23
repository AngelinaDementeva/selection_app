import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { View, ScreenSpinner, AdaptivityProvider, AppRoot, ConfigProvider, SplitLayout, SplitCol } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import io from 'socket.io-client'

import { useLocation, useRouter } from '@happysanta/router';

import { VIEW_MAIN, PANEL_MENU } from './router.js'

import Menu from './panels/Menu/Menu';
import './main.css';

const socket = io("https://srv.interviewcraft.ru", { query : { url: location.search } })

const App = () => {

	const location = useLocation(true);
	const router = useRouter();

	return (
		<ConfigProvider appearance="dark">
			<AdaptivityProvider>
				<AppRoot>
					<SplitLayout>
						<SplitCol>
							<View id={VIEW_MAIN} activePanel={location.getViewActivePanel(VIEW_MAIN)}>
								<Menu id={PANEL_MENU} socket={socket} />
							</View>
						</SplitCol>
					</SplitLayout>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
}

export default App;
