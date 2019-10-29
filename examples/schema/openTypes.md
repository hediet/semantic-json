```json
{
	"$ns": {
		"t": "json-types.org/basic-types",
		"td": "json-types.org/type-definition",
		"bla": "demo.org/bla"
	},
	"$type": "td#TypeDefinitions",
	"packageId": "bla",
	"typeDefinitions": {
		"ContactBook": {
			"kind": "object",
			"properties": {
				"contacts": { "type": { "kind": "array", "of": "bla#Contact" } }
			}
		},
		"Contact": {
			"kind": "object",
			"properties": {
				"firstName": { "type": { "kind": "string" } },
				"lastName": { "type": { "kind": "string" } }
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
