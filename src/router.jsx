import { useEffect, useState, useCallback } from 'react'

/** 极简 hash 路由：#/path */
export function getPath() {
  const h = window.location.hash.replace(/^#/, '')
  return h || '/'
}

export function useRoute() {
  const [path, setPath] = useState(getPath())
  useEffect(() => {
    const onChange = () => setPath(getPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export function navigate(path) {
  if (getPath() === path) return
  window.location.hash = path
}

export function useNavigate() {
  return useCallback(navigate, [])
}
