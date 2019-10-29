```json
{
	"$namespaces": {
		"t": "json-types.org/basic-types",
		"td": "json-types.org/type-definition"
	},
	"$type": "td#TypeDefinitions",
	"packageId": "demo.org/bla",
	"typeDefinitions": {
		"ContactBook": {
			"kind": "object",
			"properties": {
				"contacts": { "type": { "kind": "array", "of": "#Contact" } }
			}
		},
		"Contact": {
			"kind": "object",
			"properties": {
				"firstName": { "kind": "string" },
				"lastName": { "kind": "string" }
			}
		}
	}
}
```

```json
{
	"$ns": { "t": "demo.org/bla" },
	"$type": "t#ContactBook",
	"contacts": [
		{
			"firstName": "John",
			"lastName": "Doe"
		}
	]
}
```
