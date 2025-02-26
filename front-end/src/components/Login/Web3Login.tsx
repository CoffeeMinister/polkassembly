// Copyright 2019-2020 @Premiurly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { isWeb3Injected } from '@polkadot/extension-dapp';
import { InjectedAccount, InjectedWindow } from '@polkadot/extension-inject/types';
import { stringToHex } from '@polkadot/util';
import styled from '@xstyled/styled-components';
import React, { useContext, useEffect, useState } from 'react';
import { Divider, DropdownProps } from 'semantic-ui-react';
import { APPNAME } from 'src/global/appName';
import { Wallet } from 'src/types';

import ExtensionNotDetected from '../../components/ExtensionNotDetected';
import { UserDetailsContext } from '../../context/UserDetailsContext';
import { useAddressLoginMutation, useAddressLoginStartMutation } from '../../generated/graphql';
import { useRouter } from '../../hooks';
import { handleTokenChange } from '../../services/auth.service';
import AccountSelectionForm from '../../ui-components/AccountSelectionForm';
import Button from '../../ui-components/Button';
import FilteredError from '../../ui-components/FilteredError';
import { Form } from '../../ui-components/Form';
import Loader from '../../ui-components/Loader';
import getEncodedAddress from '../../util/getEncodedAddress';

interface Props {
	className?: string
	chosenWallet: Wallet
	setDisplayWeb2: () => void
}

const LoginForm = ({ className, setDisplayWeb2, chosenWallet }:Props): JSX.Element => {
	const [error, setErr] = useState<Error | null>(null);
	const [address, setAddress] = useState<string>('');
	const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
	const [isAccountLoading, setIsAccountLoading] = useState(true);
	const [extensionNotFound, setExtensionNotFound] = useState(false);
	const [accountsNotFound, setAccountsNotFound] = useState(false);
	const { history } = useRouter();
	const [addressLoginStartMutation] = useAddressLoginStartMutation();
	const [addressLoginMutation, { loading }] = useAddressLoginMutation();
	const currentUser = useContext(UserDetailsContext);

	useEffect(() => {
		if (!accounts.length) {
			getAccounts(chosenWallet);
		}
	}, [accounts.length, chosenWallet]);

	const getAccounts = async (chosenWallet: Wallet): Promise<undefined> => {
		const injectedWindow = window as Window & InjectedWindow;

		let wallet = isWeb3Injected
			? injectedWindow.injectedWeb3[chosenWallet]
			: null;

		if (!wallet) {
			wallet = Object.values(injectedWindow.injectedWeb3)[0];
		}

		if (!wallet) {
			setExtensionNotFound(true);
			setIsAccountLoading(false);
			return;
		} else {
			setExtensionNotFound(false);
		}

		const injected = await wallet.enable(APPNAME);

		const accounts = await injected.accounts.get();

		if (accounts.length === 0) {
			setAccountsNotFound(true);
			setIsAccountLoading(false);
			return;
		} else {
			setAccountsNotFound(false);
		}

		accounts.forEach((account) => {
			account.address = getEncodedAddress(account.address) || account.address;
		});

		setAccounts(accounts);
		if (accounts.length > 0) {
			setAddress(accounts[0].address);
		}

		setIsAccountLoading(false);
		return;
	};

	const onAccountChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
		const addressValue = data.value as string;
		setAddress(addressValue);
	};

	const handleLogin = async () => {
		if (!accounts.length) {
			return getAccounts(chosenWallet);
		}

		try {
			const injectedWindow = window as Window & InjectedWindow;

			let wallet = isWeb3Injected
				? injectedWindow.injectedWeb3[chosenWallet]
				: null;

			if (!wallet) {
				wallet = Object.values(injectedWindow.injectedWeb3)[0];
			}

			if (!wallet) {
				setExtensionNotFound(true);
				setIsAccountLoading(false);
				return;
			} else {
				setExtensionNotFound(false);
			}

			const injected = await wallet.enable(APPNAME);

			const signRaw = injected && injected.signer && injected.signer.signRaw;

			if (!signRaw) {
				return console.error('Signer not available');
			}

			const { data: startResult } = await addressLoginStartMutation({
				variables: {
					address
				}
			});

			const signMessage = startResult?.addressLoginStart?.signMessage;

			if (!signMessage) {
				throw new Error('Challenge message not found');
			}

			const { signature } = await signRaw({
				address,
				data: stringToHex(signMessage),
				type: 'bytes'
			});

			const { data: loginResult } = await addressLoginMutation({
				variables: {
					address,
					signature
				}
			});

			if (loginResult?.addressLogin?.token) {
				handleTokenChange(loginResult.addressLogin.token, currentUser);
				history.goBack();
			} else {
				throw new Error('Web3 Login failed');
			}
		} catch (error) {
			setErr(error);
		}
	};

	const handleToggle = () => setDisplayWeb2();

	return (
		<Form className={className} onSubmit={handleLogin}>
			<h3>Login</h3>
			{extensionNotFound?
				<div className='card'>
					<ExtensionNotDetected />
				</div>
				: null
			}
			{accountsNotFound?
				<div className='card'>
					<div className='text-muted'>You need at least one account in Polkadot-js extenstion to login.</div>
					<div className='text-muted'>Please reload this page after adding accounts.</div>
				</div>
				: null
			}
			{isAccountLoading
				?
				<Loader text={'Requesting Web3 accounts'}/>
				:
				accounts.length > 0 &&
				<>
					<Form.Group>
						<AccountSelectionForm
							title='Choose linked account'
							accounts={accounts}
							address={address}
							onAccountChange={onAccountChange}
						/>
					</Form.Group>
					<div className={'mainButtonContainer'}>
						<Button
							primary
							disabled={loading}
							type='submit'
							className='button'
						>
							Login
						</Button>

						<Button
							secondary
							disabled={loading}
							onClick={handleToggle}
							className='button'
						>
							Login with username
						</Button>
					</div>
				</>
			}
			<div>
				{error?.message && <FilteredError className='info' text={error.message}/>}
			</div>
			<Divider horizontal>Or</Divider>

			<div className='text-center'> Haven&apos;t used Polkassembly before? Sign up! </div>

			<div className={'mainButtonContainer'}>
				<Button secondary onClick={() => history.push('/signup')} type='button' className='button pink_primary-text'>
					Sign-up
				</Button>
			</div>
		</Form>
	);
};

export default styled(LoginForm)`
	.mainButtonContainer {
		align-items: center;
		display: flex;
		justify-content: center;
		flex-direction: column;
	}

	input.error {
		border-style: solid;
		border-width: 1px;
		border-color: red_secondary;
	}

	.text-center{
		text-align: center;
		margin-bottom: 0.3em;
	}

	.info {
		margin: 10px 0;
	}

	.errorText {
		color: red_secondary;
	}

	.ui.dimmer {
		height: calc(100% - 6.5rem);
	}

	.button {
		width: 80%;
		margin: 4px 0;
		height: 40px;
	}

	.pink_primary-text{
		color: pink_primary !important;
	}
`;
