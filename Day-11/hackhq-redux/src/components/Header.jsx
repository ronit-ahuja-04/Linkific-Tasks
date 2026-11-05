import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { transparentize } from 'polished';
import { Zap, Activity, Moon, Sun, Search, LogIn, LogOut, Menu } from 'lucide-react';
import { Button, Kbd } from './ui.jsx';
import NotificationBell from './NotificationBell.jsx';

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 1020;
  height: ${({ theme }) => theme.headerHeight};
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.5rem;
  padding: 0 0.75rem;
  background: ${({ theme }) => transparentize(0.15, theme.colors.bg)};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  ${({ theme }) => theme.media.up('sm')} {
    padding: 0 1.5rem;
  }
`;
const Pill = styled(Button)`
  ${({ $on, theme }) =>
    $on &&
    css`
      color: ${theme.colors.accent};
      border-color: ${theme.colors.accent};
      background: ${theme.colors.accentSoft};
    `}
`;
const SquareBtn = styled(Pill)`
  padding: 0;
  width: 2.5rem;
  height: 2.5rem;
`;
const NavBtn = styled(SquareBtn)`
  ${({ theme }) => theme.media.up('lg')} {
    display: none;
  }
`;
const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
`;
const Logo = styled.span`
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow};
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
`;
const BrandText = styled.span`
  line-height: 1;
`;
const Name = styled.span`
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
`;
const Tag = styled.span`
  display: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.muted};
  ${({ theme }) => theme.media.up('sm')} {
    display: block;
  }
`;
const Actions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const PaletteBtn = styled(Pill)`
  min-width: 2.5rem;
  color: ${({ theme }) => theme.colors.muted};
  ${({ theme }) => theme.media.up('lg')} {
    min-width: 13rem;
  }
`;
const LgOnly = styled.span`
  display: none;
  ${({ theme }) => theme.media.up('lg')} {
    display: inline;
  }
`;
const KbdLg = styled(Kbd)`
  display: none;
  ${({ theme }) => theme.media.up('lg')} {
    display: inline;
  }
`;
const JumpText = styled(LgOnly)`
  flex-grow: 1;
  text-align: left;
`;
const SmUp = styled.span`
  display: none;
  ${({ theme }) => theme.media.up('sm')} {
    display: inline;
  }
`;
const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;
const OrganizerBtn = styled(Pill)`
  color: ${({ theme }) => theme.colors.good};
  border-color: ${({ theme }) => theme.colors.good};
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.goodSoft};
  }
`;
const Dot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${({ theme, $color }) => $color ?? theme.colors.good};
  ${({ $dim }) => $dim && 'opacity: 0.4;'}
`;
const XrayBtn = styled(Pill)`
  display: none;
  ${({ theme }) => theme.media.up('md')} {
    display: inline-flex;
  }
`;

export default function Header({
  theme,
  onToggleTheme,
  xrayOn,
  onToggleXray,
  onOpenPalette,
  onOpenNav,
  isOrganizer,
  onLogout,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  const handleSwitchKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggleTheme();
    }
  };

  return (
    <Bar>
      <NavBtn $variant="secondary" onClick={onOpenNav} aria-label="Open navigation">
        <Menu size={18} aria-hidden="true" />
      </NavBtn>

      <Brand to="/" aria-label="HackHQ mission control home">
        <Logo aria-hidden="true">
          <Zap size={18} strokeWidth={2.5} />
        </Logo>
        <BrandText>
          <Name>HackHQ</Name>
          <Tag>DAY-OF CONTROL ROOM</Tag>
        </BrandText>
      </Brand>

      <Actions>
        {/* W5: Command palette trigger (also ⌘K / Ctrl+K) */}
        <PaletteBtn
          $variant="secondary"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden="true" />
          <JumpText>Jump to…</JumpText>
          <KbdLg>⌘K</KbdLg>
        </PaletteBtn>

        {/* Organizer session (M4): log in link or log out button */}
        {isOrganizer ? (
          <OrganizerBtn $variant="secondary" onClick={handleLogout}>
            <Dot aria-hidden="true" />
            <SmUp>Organizer</SmUp>
            <LogOut size={15} aria-hidden="true" />
            <VisuallyHidden>Log out</VisuallyHidden>
          </OrganizerBtn>
        ) : (
          <Pill as={Link} to="/login" $variant="secondary">
            <LogIn size={15} aria-hidden="true" />
            <SmUp>Log in</SmUp>
          </Pill>
        )}

        {/* State X-ray Toggle Pill */}
        <XrayBtn
          $variant="secondary"
          $on={xrayOn}
          onClick={onToggleXray}
          aria-pressed={xrayOn}
          title="Toggle live State X-ray inspector"
        >
          <Activity size={15} aria-hidden="true" />
          <span>State X-ray</span>
          <Dot aria-hidden="true" $color="currentColor" $dim={!xrayOn} />
        </XrayBtn>

        <NotificationBell />

        <SquareBtn
          $variant="secondary"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={onToggleTheme}
          onKeyDown={handleSwitchKeyDown}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </SquareBtn>
      </Actions>
    </Bar>
  );
}
