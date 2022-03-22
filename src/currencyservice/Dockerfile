# Use golang image as a builder for currencyservice
FROM golang:1.16.7-alpine3.14 AS builder

# Create and set workdir
WORKDIR /workspace

# Copy `go.mod` for definitions and `go.sum` to invalidate the next layer
# in case of a change in the dependencies
COPY ./go.mod ./

# Install git to be used "go mod download"
RUN apk add --no-cache git

# Download dependencies
RUN go mod download

# Copy all files and build an executable
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o currencyservice

## Image to run currency service
# Use a Docker multi-stage build to create a lean production image
FROM alpine:3.14.1
RUN apk add --no-cache ca-certificates
COPY --from=builder /workspace/currencyservice ./
EXPOSE 8080
ENTRYPOINT ["/currencyservice"]