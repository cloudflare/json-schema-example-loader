## v2.0.0

* `"required"` and `"type"` now behave normally with the LDO's `"schema"` (previously they needed to be outside of `"schema"` at the top of the LDO)
* the nonstandard behavior of `"additionalProperties"` (properties that are not rolled up in the request/response examples) is now implemented as `"extraProperties"`
* Properties named `"ID"` are no longer treated specially (downcased to `"id"   ) as this was a workaround for a problem that no longer exists.

## v1.2.2

* Correctly generate curl examples when `"requestHeaders"` is `{}`

## v1.2.1

* Add `which_of` to the top level of `object_definition` to allow distinguishing between use of `"oneOf"` vs `"anyOf"`.  This is a bit of a hack but will get fixed more thoroughly in a future major version.


