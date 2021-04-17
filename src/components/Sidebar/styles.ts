import { H1 } from '@blueprintjs/core'
import styled from 'styled-components'

export const SidebarContainer = styled.nav`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    color: ${props => props.theme.sidebarText};
    background-color: ${ props => props.theme.sidebarBg };
    border-right: 3px solid "#CACBCC"
`

export const Header = styled(H1)`
    font-size: 3em !important;
    line-height: 1.2em !important;
    font-weight: bold;
    word-wrap: break-word;
    width: 100%;
    padding: .5em .4em;
`
