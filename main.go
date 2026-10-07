package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
)

func main() {
	listener, err := net.Listen("tcp", ":21114")
	if err != nil {
		fmt.Fprintln(os.Stderr, "Port `21114` already in use.")
		os.Exit(1)
	}
    
    http.Serve(listener, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", "0")
		w.Header().Del("Content-Type")
		w.WriteHeader(http.StatusOK)
	}))

	fmt.Println("Started fake RustDesk API Server at TCP:21114")
	
}
