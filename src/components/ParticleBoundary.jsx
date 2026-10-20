import { Component } from 'react';

// A graphics/module failure must never remove the semantic portfolio.
export default class ParticleBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure?.();
  }

  render() {
    return this.state.failed
      ? <div className="particle-loading" aria-hidden="true" />
      : this.props.children;
  }
}
