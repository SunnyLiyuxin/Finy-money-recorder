import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('View crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#FF6B6B', fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>页面渲染出错</div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.5 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
