import test from 'ava'
import execa from 'execa'

test(async t => {
	const {stdout} = await execa('./index.js', ['--version'])
	t.true(stdout.length > 0)
})
