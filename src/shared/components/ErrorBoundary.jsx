import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-gold text-2xl mb-3">Something went wrong</h1>
          <p className="text-warmGray mb-6">
            This page ran into a problem. Try going back to the homepage.
          </p>
          <a
            href="/"
            className="inline-block bg-gold text-charcoal font-semibold rounded-lg px-5 py-2.5 hover:bg-champagne transition-colors"
          >
            Back to Home
          </a>
        </div>
      )
    }

    return this.props.children
  }
}