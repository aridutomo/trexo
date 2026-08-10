package domain

import "errors"

// Code mirrors the GAS error codes the frontend already understands
// (src/lib/gas-client.ts mapStatus). Dropped UPSTREAM (no upstream anymore).
type Code string

const (
	CodeUnauth     Code = "UNAUTH"
	CodeForbidden  Code = "FORBIDDEN"
	CodeNotFound   Code = "NOT_FOUND"
	CodeValidation Code = "VALIDATION"
	CodeInternal   Code = "INTERNAL"
)

// AppError is the canonical error type carried through the layers. The HTTP
// layer maps Code -> status and emits {"error":{"code","message"}}.
type AppError struct {
	Code    Code
	Message string
	Cause   error
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return e.Message + ": " + e.Cause.Error()
	}
	return e.Message
}
func (e *AppError) Unwrap() error { return e.Cause }

func ErrUnauth(msg string) *AppError     { return &AppError{Code: CodeUnauth, Message: orMsg(msg, "Unauthorized")} }
func ErrForbidden(msg string) *AppError  { return &AppError{Code: CodeForbidden, Message: orMsg(msg, "Forbidden")} }
func ErrNotFound(msg string) *AppError   { return &AppError{Code: CodeNotFound, Message: orMsg(msg, "Not found")} }
func ErrValidation(msg string) *AppError { return &AppError{Code: CodeValidation, Message: orMsg(msg, "Validation error")} }
func ErrInternal(err error) *AppError    { return &AppError{Code: CodeInternal, Message: "Internal error.", Cause: err} }

func orMsg(msg, def string) string {
	if msg == "" {
		return def
	}
	return msg
}

// AsAppError unwraps any error into an *AppError, defaulting to INTERNAL.
func AsAppError(err error) *AppError {
	var ae *AppError
	if errors.As(err, &ae) {
		return ae
	}
	return ErrInternal(err)
}
