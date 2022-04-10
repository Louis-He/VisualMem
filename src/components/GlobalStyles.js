import styled from 'styled-components'

export const MainBody = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  border-color: ${({ theme }) => theme.borderColor};
  min-height: 90vh;
`

//   transition: all 1s linear;