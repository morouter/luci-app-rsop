package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"time"
)

func main() {
	listener, err := net.Listen("tcp", ":21114")
	if err != nil {
		fmt.Fprintln(os.Stderr, "Port `21114` already in use.")
		os.Exit(1)
	}

	srv := &http.Server{
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Length", "0")
			w.Header().Del("Content-Type")
			w.WriteHeader(http.StatusOK)
		}),
		ReadHeaderTimeout: 5 * time.Second,
	}

	fmt.Println("Started fake RustDesk API Server at TCP:21114")
	if err := srv.Serve(listener); err != nil && err != http.ErrServerClosed {
		fmt.Fprintln(os.Stderr, "RustDesk API server error:", err)
		os.Exit(1)
	}
}
