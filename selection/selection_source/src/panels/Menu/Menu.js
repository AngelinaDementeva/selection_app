import React, { useEffect, useState, useRef } from 'react';

import { Panel, SegmentedControl, Div, Input, FormItem, CustomSelect, Button } from '@vkontakte/vkui';
import { Icon28TablecellsOutline, Icon28LaptopOutline, Icon24Document, Icon36Send, Icon28SettingsOutline, Icon28CopyOutline } from '@vkontakte/icons'
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Terminal, { ColorMode, TerminalOutput } from 'react-terminal-ui';

import { useLocation, useRouter, useParams } from '@happysanta/router';

import Editor from "../../components/Editor/Editor";
import useLocalStorage from "../../components/hooks/useLocalStorage";
import Annotation from "../../components/Annotation/Annotation";

let languages = [
	{ value: 'javascript', label: "JavaScript" },
	{ value: 'php', label: "PHP" },
	{ value: 'python', label: "Python" }
]

function getRoomWord(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let word = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        word += alphabet[randomIndex];
    }
    return word;
}

const Menu = ({ id, socket }) => {
	const fileInputRef = useRef(null);
	const { roomParams } = useParams();

	const [room, setRoom] = useState(0)

	const [fileDataAfterLoad, setFileDataAfterLoad] = useState('')

	const [stage, setStage] = useState('selection')
	const [keyword, setKeyword] = useState('')
	const [results, setResults] = useState([])

	const [terminalLineData, setTerminalLineData] = useState([
		<TerminalOutput>Happy coding!</TerminalOutput>
	]);
	
	const [selectLanguage, setSelectLanguage] = useState('javascript')
	const [php, setPhp] = useState('')
	const [javascript, setJavascript] = useState('')
	const [python, setPython] = useState('')

	const [tableStage, setTableStage] = useState('upload')
	const [selectedFile, setSelectedFile] = useState(null);

	const handleFileChange = (event) => {
		setSelectedFile(event.target.files[0]);
	};

	useEffect(()=>{
		const reader = new FileReader();
		reader.onload = () => {
			const fileData = reader.result;
			setFileDataAfterLoad(fileData)
			socket.emit('getResults', { fileData, keyword: 'Образование' })
			socket.emit('getResults', { fileData, keyword: 'Навыки' })
			socket.emit('getResults', { fileData, keyword: 'Языки' })
			setTableStage('loading')

			let loadingTimeout = setTimeout(()=>{
				setTableStage('results')
			},2500)

			return () => {
				clearTimeout(loadingTimeout)
			}
		};

		if (!selectedFile) return

		reader.readAsArrayBuffer(selectedFile);
	},[selectedFile])

	const handleDivClick = () => {
		fileInputRef.current.click();
	};

	useEffect(() => {
		socket.on('getResults', (arg) => {
			setResults(prevResults => [...prevResults, { keyword: arg.keyword, result: arg.result }]);
		});

		socket.on('error', (arg) => {
			setTableStage('upload')
		})

		socket.on('phpResults', (arg) => {
			setTerminalLineData(prevState => [
				...prevState,
				<TerminalOutput>{arg.result}</TerminalOutput>
			]);
		})

		socket.on('pythonResults', (arg) => {
			setTerminalLineData(prevState => [
				...prevState,
				<TerminalOutput>{arg.result}</TerminalOutput>
			]);
		})

		socket.on('nodeResults', (arg) => {
			setResults(arg.result)
			setTerminalLineData(prevState => [
				...prevState,
				<TerminalOutput>{arg.result}</TerminalOutput>
			]);
		})

		socket.on('codeError', (arg) => {
			setTerminalLineData(prevState => [
				...prevState,
				<TerminalOutput>{arg.data}</TerminalOutput>
			]);
		})

		socket.on('connectRoom', (arg) => {
			console.log(arg)
			setRoom({ roomWord: arg.roomWord, mode: arg.mode })
			console.log(room)

			if (arg.mode == 'reader') {
				socket.emit('getData', { roomWord: arg.roomWord })
			}
		})

		socket.on('gotData', (arg) => {
			console.log(arg.data[0].code)
			setSelectLanguage(arg.data[0].selectLanguage)
			if (arg.data[0].selectLanguage === 'php') {
				setPhp(arg.data[0].code);
			} else if (arg.data[0].selectLanguage === 'javascript') {
				setJavascript(arg.data[0].code);
			} else if (arg.data[0].selectLanguage === 'python') {
				setPython(arg.data[0].code);
			}
		})

		if (!roomParams) {
			let roomWord = getRoomWord(7);
			
			socket.emit('createRoom', { roomWord })
		} else {
			let roomWord = roomParams;
			socket.emit('connectToRoom', { roomWord })
		}
	}, []);

	socket.on('serveData', (arg) => {
		console.log('serving data from me!')
		let servingData = [{
			selectLanguage: selectLanguage,
			code: selectLanguage === 'php' ? php : selectLanguage === 'javascript' ? javascript : python,
		}];

		console.log(servingData)
		
		socket.emit('servedData', { data: servingData, roomWord: room.roomWord });
	})

	useEffect(()=>{
		socket.on('changedSelectLanguage', (arg) => {
			if (room.mode == 'creator') return;

			setSelectLanguage(arg.select)
		})

		socket.on('updateCode', (arg) => {
			console.log('wasd');
			if (room.mode === 'creator') return;
		
			if (arg.language === 'php') {
				setPhp(prevPhp => arg.code);
			} else if (arg.language === 'javascript') {
				setJavascript(prevJavascript => arg.code);
			} else if (arg.language === 'python') {
				setPython(prevPython => arg.code);
			}
		});
	},[room])

	function compile() {
		if (selectLanguage == 'javascript') {
			socket.emit('compileNode', { jsCode: javascript, roomWord: room.roomWord })			
		} else if (selectLanguage == 'php') {
			socket.emit('compilePhp', { phpCode: php, roomWord: room.roomWord }) 
		} else {
			socket.emit('compilePython', { pythonCode: python, roomWord: room.roomWord })
		}
	}

	function terminal(command) {
		if (command == 'authors') {
			setTerminalLineData(prevState => [
				...prevState,
				<TerminalOutput>ONAPPS ✌️</TerminalOutput>
			]);
		} else if (command == 'node') {
			socket.emit('compileNode', { jsCode: javascript, roomWord: room.roomWord })					
		} else if (command == 'php') {
			socket.emit('compilePhp', { phpCode: php, roomWord: room.roomWord }) 
		} else {
			socket.emit('compilePython', { pythonCode: python, roomWord: room.roomWord })
		}
	}

	const handleCodeChange = (e) => {
		const value = e;
		if (selectLanguage === 'php') {
			setPhp(value);
		} else if (selectLanguage === 'javascript') {
			setJavascript(value);
		} else if (selectLanguage === 'python') {
			setPython(value);
		}
	
		socket.emit('updateCode', {
			roomWord: room.roomWord,
			code: value,
			language: selectLanguage
		});
	};

	return (
		<Panel id={id}>
			<Div>
				<SegmentedControl
					value={stage}
					onChange={(value) => setStage(value)}
					options={[
						{
							'label': <Icon28TablecellsOutline />,
							'value': 'selection',
							'aria-label': 'Список',
						},
							{
							'label': <Icon28LaptopOutline />,
							'value': 'coding',
							'aria-label': 'Плитки',
						},
					]}
				/>
			</Div>
			{ stage == 'selection' ? 
				<>
					<Div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
						<Input style={{ width: "100%" }} placeholder="Ключевое слово" value={keyword} onChange={(e) => { setKeyword(e.target.value) }} />
						<Div className="sendButton" style={{ marginRight: 20, cursor: "pointer" }} onClick={()=>{ socket.emit('getResults', { fileData: fileDataAfterLoad, keyword: keyword }) }}>
							<Icon36Send width={24} height={24} />
						</Div>
					</Div>

					{ tableStage == 'upload' ?
						(
							<Div style={{ justifyContent: "center", alignItems: "center", display: "flex", cursor: "pointer" }} onClick={handleDivClick}>
								<div style={{height: 400, width: "100%", background: "#232324", borderRadius: 16 }}>
									<div style={{ justifyContent: "center", alignItems: "center", display: "flex", height: "100%" }}>
										<Icon24Document role="presentation" style={{ width: 50, height: 50 }} />
										<input
											ref={fileInputRef}
											type="file"
											style={{ display: 'none' }}
											onChange={handleFileChange}
										/>
									</div>
								</div>
							</Div>
						)
					: tableStage == 'loading' ?
						(
							<Div style={{ justifyContent: "center", alignItems: "center", display: "flex" }}>
								<div style={{height: 400, width: "100%", background: "#232324", borderRadius: 16 }}>
									<div style={{ justifyContent: "center", alignItems: "center", display: "flex", height: "100%" }}>
										<div class="loader"></div> 
									</div>
								</div>
							</Div>
						)
					:
						(
							<Div style={{ justifyContent: "center", alignItems: "center", display: "flex" }}>
								<table>
									<tr>
										<th>Ключевые слова</th>
										<th>Результат</th>
									</tr>
									{results.map((item, index) => {
										return (
											<>
												<tr>
													<td>{item.keyword}</td>
													<td>{item.result}</td>
												</tr>
											</>
										)
									})}
								</table>
							</Div>
						)
					}
				</>
			:
				<>
					<FormItem
						top="Язык программирования"
						htmlFor="administrator-select-id"
						style={{ flexGrow: 1, flexShrink: 1 }}
					>
						<CustomSelect
							disabled={ room.mode == 'reader' }
							id="administrator-select-id"
							placeholder="Не выбран"
							options={languages}
							value={selectLanguage}
							onChange={(e) => { setSelectLanguage(e.target.value), socket.emit('changeSelectLanguage', { select: e.target.value, roomWord: room.roomWord } ) }}
							allowClearButton
						/>
					</FormItem>
					<Div style={{ marginTop: -5 }}>
						<Editor
							language={selectLanguage}
							disabled={room.mode == 'reader'}
							value={selectLanguage == 'php' ? php : selectLanguage == 'javascript' ? javascript :  python}
							onChange={handleCodeChange}
						/>
						{ room.mode == 'reader' ? null :
							( <div align="center" style={{ flexDirection: "row", display: "flex", justifyContent: "center", gap: 10 }}>
								<Button onClick={()=>{ compile() }} stretched mode="outline" size="l" style={{ marginTop: 16, maxWidth: 400 }} before={<Icon28SettingsOutline width={22} height={22} />}>Compile</Button>
								<CopyToClipboard text={`https://vk.com/app51891805/#/?roomParams=${room.roomWord}`}>
									<Button stretched mode="outline" size="l" style={{ marginTop: 16, maxWidth: 20 }}><Icon28CopyOutline /></Button>
								</CopyToClipboard>
							</div>
						)}
						<div className="container" style={{ marginTop: 16 }}>
							<Terminal height={200} name='Terminal' colorMode={ ColorMode.Dark } onInput={ terminalInput => ( room.mode == 'reader' ? console.log('you are Reader!') : terminal(terminalInput) ) }>
								{ terminalLineData }
							</Terminal>
						</div>
					</Div>
				</>
			}
		</Panel>
	)
}

export default Menu;
