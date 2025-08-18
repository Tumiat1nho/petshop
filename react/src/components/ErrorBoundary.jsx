import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(error){ return { hasError: true, err: error }; }
  componentDidCatch(error, info){ console.error('UI error:', error, info); }
  render(){
    if (this.state.hasError){
      return (
        <div style={{padding:20, color:'#b00020'}}>
          Opa, houve um erro ao renderizar esta página.
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
