
export const validateUserInput = (regexParam) => (userInput) => {
	const checks = Object.keys(regexParam).filter((msg) => {
		const exp = regexParam[msg]
		const negate = /^not:\s*/.test(exp)
		const regex = new RegExp(negate ? exp.replace(/^not:\s*/, '') : exp)
		const showMessage = !regex.test(userInput)
		if (negate) {
			if (!showMessage) {
				return msg
			}
		} else {
			if (showMessage) {
				return msg
			}
		}
	})
	if (checks.length > 0) {
		return checks.join(' ')
	}
	// all validations for this param passed
	return true
}
