import React, { useState } from "react";
// codemirror default styles and material theme
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/theme/material-darker.css";

// importing languages that editor is going to use
import "codemirror/mode/xml/xml";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/css/css";
import 'codemirror/mode/php/php';
import 'codemirror/mode/python/python';

// importing editor component on which we can control input and output with onChange event handler and our own values like input in html
import { Controlled as ControlledEditor } from "react-codemirror2";

function Editor(props) {
	// destructuring the passed props
	const { language, displayName, value, onChange, disabled, theme } = props;

	// state to open and close tabs of editor
	const [open, setOpen] = useState(true);

	function handleChange(editor, data, value) {
		if(disabled == true) return;
		onChange(value);
	}

	return (
		<React.Fragment>
			<div className={`Editor-container ${open === true ? "" : "collapsed"}`}>
				{displayName}
				<ControlledEditor
					onBeforeChange={handleChange} 
					value={value} 
					borderRadius='16px'
					disabled={disabled}
					className="code-mirror-wrapper"
					options={{
						lineWrapping: true,
						lint: true,
						mode: language,
						plain: true,
						theme: "material-darker",
						lineNumbers: true,
					}}
				/>
			</div>
		</React.Fragment>
	);
}

export default Editor;
