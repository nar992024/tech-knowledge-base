import { ImageResponse } from 'next/og'

export const alt = 'Tech Knowledge Base'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: '#0a1120',
          color: '#e8effa',
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700 }}>Tech Knowledge Base</div>
        <div style={{ fontSize: 38, marginTop: 28, color: '#65dbed' }}>
          Learning paths for AI coding and agent engineering
        </div>
      </div>
    ),
    size
  )
}
