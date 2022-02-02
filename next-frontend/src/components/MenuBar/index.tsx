// Copyright 2019-2020 @Premiurly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import styled from '@xstyled/styled-components';
import React from 'react';
import { ReactNode, useContext, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Accordion, Dropdown, Icon, Menu, Responsive, Sidebar, SidebarPusher } from 'semantic-ui-react';
import NetworkDropdown from '../../ui-components/NetworkDropdown';

import logo from '../../assets/polkassembly-logo.png';
import { UserDetailsContext } from '../../context/UserDetailsContext';
import { useLogoutMutation } from '../../generated/graphql';
import { useFetchLatestBlockNumberQuery } from '../../generated/graphql';
import { logout } from '../../services/auth.service';
import getNetwork from '../../util/getNetwork';
import AddressComponent from '../../ui-components/Address';

interface Props {
	children?: ReactNode,
	className?: string,
	visible?: boolean
}

const NETWORK = getNetwork();

const MenuBar = ({ className } : Props): JSX.Element => {
	const currentUser = useContext(UserDetailsContext);
	const [logoutMutation] = useLogoutMutation();
	const router = useRouter();
	const { setUserDetailsContextState, username } = currentUser;
	const { data } = useFetchLatestBlockNumberQuery();

	const latestBlockNumber = data?.blockNumbers[0]?.number;

	const blockUrl = `https://${NETWORK}.subscan.io/block/${latestBlockNumber}`;

	const handleLogout = async () => {
		try {
			await logoutMutation();
		} catch (error) {
			console.error(error);
		}
		logout(setUserDetailsContextState);
		router.push('/');
	};

	// Menu Items
	const contentItems = [
		{ content: 'Discussions', icon:'comments', to:'/discussions' }
	];

	const onchainItems = [
		{ content: 'Overview', to: '/onchain' },
		{ content: 'Referenda', to: '/referenda' },
		{ content: 'Proposals', to: '/proposals' },
		{ content: 'Motions', to: '/motions' },
		{ content: 'Treasury proposals', to: '/treasury-proposals' },
		{ content: 'Tech comm proposals', to: '/tech-comm-proposals' },
		{ content: 'Tips', to: '/tips' },
		{ content: 'Bounties', to: '/bounties' },
		{ content: 'Council', to: '/council' },
		{ content: 'Search', to: '/search' }
	];

	const loggedOutItems = [
		{ content:'Login', icon:'sign in', to:'/login' },
		{ content: 'Sign-up', icon:'plus circle', to:'/signup' }
	];

	const loggedInItems = [
		{ content:'Notifications', icon:'bell', to:'/notification-settings' },
		{ content:'Settings', icon:'cog', to:'/settings' },
		{ content:'Tracker', icon:'bookmark', to:'/tracker' },
		{ content:'Logout', icon:'sign-out', onClick: handleLogout, to:'/' }
	];

	const userMenu = currentUser.web3signup && currentUser.defaultAddress
		? <><AddressComponent address={currentUser.defaultAddress} /></>
		: <><Icon name='user circle' inverted />{username}</>;

	const caretIcon = <Icon name='caret down' inverted />;

	// Mobile Sidebar
	const [menuVisible, setMenuVisible] = useState(false);
	const [pushableHeight, setPushableHeight] = useState('0rem');
	const [accordionActive, setAccordionActive] = useState(false);

	const handleToggle = () => {
		menuVisible ? setMenuVisible(false) : setMenuVisible(true);
		menuVisible ? setPushableHeight('0rem'): setPushableHeight('100%');
	};

	const handleClose = () => {
		setMenuVisible(false);
		setPushableHeight('0rem');
	};

	const handleAccordionClick = () => {
		setAccordionActive(!accordionActive);
	};

	return (
		<>
			<Responsive maxWidth={Responsive.onlyTablet.maxWidth}>
				<Menu className={`${className} ${NETWORK}`} inverted widths={2} id='menubar'>
					<Menu.Item className='logo' id='title' onClick={handleClose}><Link href="/" passHref><a><Image alt='Polkassembly Logo' layout='intrinsic' width={100} height={33.33} src={logo} /></a></Link></Menu.Item>
					<Menu.Menu position="right">
						<NetworkDropdown />
						<Menu.Item onClick={handleToggle} id='rightmenu'>
							{!menuVisible ? <Icon name="sidebar" /> : <MdClose />}
						</Menu.Item>
					</Menu.Menu>

				</Menu>
				<Sidebar.Pushable className={className} style={{ height:pushableHeight }}>
					<Sidebar
						as={Menu}
						direction='top'
						icon="labeled"
						inverted
						stackable
						vertical
						visible={menuVisible}
					>
						<Accordion>
							{contentItems.map((item, index) =>  <Menu.Item key={index} onClick={handleClose} icon={item.icon}><Link href={item.to}>{item.content}</Link></Menu.Item>)}
							<Accordion.Title
								active={accordionActive}
								index={0}
								onClick={handleAccordionClick}
							>
								<Menu.Item as='a' content='On-chain' icon='chain' to='#' />
							</Accordion.Title>
							<Accordion.Content active={accordionActive}>
								{onchainItems.map((item, index) => <Menu.Item key={index} onClick={handleClose}><Link href={item.to}>{item.content}</Link></Menu.Item> )}
							</Accordion.Content>
							{username
								?
								<>
									{loggedInItems.map((item, index) => <Menu.Item key={index} icon={item.icon}><Link href={item.to}>{item.content}</Link></Menu.Item>)}
								</>
								:
								<>
									{loggedOutItems.map((item, index) => <Menu.Item key={index} onClick={handleClose} icon={item.icon}><Link  href={item.to}>{item.content}</Link></Menu.Item>)}
								</>
							}
							{latestBlockNumber ? <Menu.Item>
								<Icon name="cube" />
								<a href={blockUrl} target='_blank' rel='noreferrer'>{` ${latestBlockNumber}`}</a>
							</Menu.Item> : null}
						</Accordion>
					</Sidebar>
					<SidebarPusher />
				</Sidebar.Pushable>
			</Responsive>

			<Responsive minWidth={Responsive.onlyComputer.minWidth}>
				<Menu className={`${className} ${NETWORK}`} stackable inverted borderless>
					<Menu.Item className='logo' id='title'><Link href="/" passHref><a><Image alt='Polkassembly Logo' layout='intrinsic' width={138} height={46} src={logo} /></a></Link></Menu.Item>
					{contentItems.map((item, index) => <Menu.Item key={index} className='desktop_items'><Link href={item.to}>{item.content}</Link></Menu.Item>)}
					<Menu.Item className='desktop_items'>
						<Dropdown trigger={<>On-chain</>} icon={caretIcon} item={true}>
							<Dropdown.Menu>
								{onchainItems.map((item, index) =><Menu.Item key={index}><Link href={item.to}>{item.content}</Link></Menu.Item>)}
							</Dropdown.Menu>
						</Dropdown>
					</Menu.Item>
					{latestBlockNumber ? <Menu.Item>
						<Icon name="cube" style={{ marginRight: '10px' }}/>
						<Link href={blockUrl} passHref><a target='_blank' rel='noreferrer'>{` ${latestBlockNumber}`}</a></Link>
					</Menu.Item> : null}
					<Menu.Menu position="right">
						<NetworkDropdown />
						{username
							? <>
								<Dropdown trigger={userMenu} icon={caretIcon} item={true}>
									<Dropdown.Menu>
										{loggedInItems.map((item, index) => <Menu.Item key={index} icon={item.icon}><Link href={item.to}>{item.content}</Link></Menu.Item>)}
									</Dropdown.Menu>
								</Dropdown>
							</>
							: <>
								{loggedOutItems.map((item, index) => <Menu.Item  key={index} className='user_items'><Link href={item.to}>{item.content}</Link></Menu.Item>)}
							</>
						}
					</Menu.Menu>
				</Menu>
			</Responsive>
		</>
	);
};

export default styled(MenuBar)`

	&.polkadot {
		border-top: solid !important;
		border-top-color: pink_primary !important;
	}

	&.ui.menu, .ui.inverted.menu {
		font-family: font_default;
		background-color: black_full;
		border-radius: 0rem;
		letter-spacing: 0.2px;

		&a.active {
			outline: none;
			background-color: black_full !important;
		}
		.item{
			color: grey_secondary;
			font-weight: 500;
			&:hover {
				color: white;
			}
		}

		i.icon {
			color: grey_secondary;
		}

		.logo {
			img {
				width: 16rem;

				@media only screen and (max-width: 992px) {
					width: 10rem;
				}
			}
			background-color: black_full !important;
		}
	}

	@media only screen and (max-width: 992px) {

		&.pushable {
			position: relative;
		}

		&.ui.menu, .ui.inverted.menu {
			min-height: 5rem;
			border-bottom-style: solid;
			border-bottom-width: 1px;
			border-bottom-color: grey_primary;
			margin: 0rem!important;

			.desktop_items, #title {
				position: absolute;
			}

			.desktop_items, #title {
				text-align: left;
				margin: auto 0;
				left: 2rem;
				top: 0.3rem;
				padding-top: 1rem;
				padding-bottom: 0;
				border-radius: 0.8rem!important;
			}

			#rightmenu {
				font-size: lg;
				max-width: 2rem;
				margin-right: 2rem !important;
				margin-left: 2rem !important;
			}

			.item {
				font-size: md;
				display: inline-block;
				&:before {
					width: 0rem;
				}
			}

			a.item:hover {
				background: none;
				color: grey_secondary;
			}
		}

		.ui.top.sidebar {
			padding: 1rem;
			border-radius: 0rem!important;
			position: relative;
			.item {
				float: left;
				clear: both;
				text-align: left;
				border-radius: 0.8rem!important;
			}
		}

		.ui.icon.menu .item {
			text-align: left;
			padding: 1.5rem 1rem;
			&>.icon:not(.dropdown) {
				font-size: 1.6rem!important;
				display: inline-block;
				margin: 0 1.2rem auto 0!important;
			}
		}
	}

	@media only screen and (min-width: 992px) {
		&.ui.menu {
			padding: 0.5rem 2rem;
			font-size: md;
			.item {
				padding: 0.5rem 0.5rem;
				margin: 0 1.2rem;
				:hover {
					background-color: black_full !important;
				}
			}

			.ui.dropdown .menu>.item,
			.ui.dropdown .menu>.active.item {
				font-size: md!important;
				font-weight: 400 !important;
			}
		}

		.desktop_items, .user_items, #title {
			i.icon {
				display: none;
			}
			i.icon.caret {
				display: block;
			}
		}

	}

	&.ui.inverted.menu a.item:hover, &.ui.inverted.menu .dropdown.item:hover {
		border-radius: 0.5rem;
	}
`;
