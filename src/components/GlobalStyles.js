import styled from 'styled-components'

export const MainBody = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  border-color: ${({ theme }) => theme.borderColor};
  transition: all 1s linear;
  min-height: 100vh;
`