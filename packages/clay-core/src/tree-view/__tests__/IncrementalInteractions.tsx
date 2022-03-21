/**
 * SPDX-FileCopyrightText: © 2022 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

import Button from '@clayui/button';
import {ClayCheckbox as Checkbox} from '@clayui/form';
import {cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import React from 'react';

import {Provider, TreeView} from '../..';

const spritemap = 'icons.svg';

// Just to avoid TypeScript error with required props
const OptionalCheckbox = (props: any) => <Checkbox {...props} />;

OptionalCheckbox.displayName = 'ClayCheckbox';

describe('TreeView incremental interactions', () => {
	afterEach(cleanup);

	it('expand item when click on the expander', () => {
		const {container} = render(
			<Provider spritemap={spritemap}>
				<TreeView>
					<TreeView.Item key="Root">
						<TreeView.ItemStack>Root</TreeView.ItemStack>
						<TreeView.Group>
							<TreeView.Item key="Item">Item</TreeView.Item>
						</TreeView.Group>
					</TreeView.Item>
				</TreeView>
			</Provider>
		);

		const expanderButton = container.querySelector(
			'.component-expander'
		) as HTMLButtonElement;

		fireEvent.click(expanderButton);

		const linkItem = container.querySelector(
			'.treeview-link'
		) as HTMLDivElement;

		expect(linkItem.getAttribute('aria-expanded')).toBe('true');
		expect(container.querySelector('.collapse.show')).toBeTruthy();
	});

	it('hide item by clicking expander', async () => {
		jest.useFakeTimers();

		const {container} = render(
			<Provider spritemap={spritemap}>
				<TreeView>
					<TreeView.Item key="Root">
						<TreeView.ItemStack>Root</TreeView.ItemStack>
						<TreeView.Group>
							<TreeView.Item key="Item">Item</TreeView.Item>
						</TreeView.Group>
					</TreeView.Item>
				</TreeView>
			</Provider>
		);

		const expanderButton = container.querySelector(
			'.component-expander'
		) as HTMLButtonElement;

		fireEvent.click(expanderButton);

		const linkItem = container.querySelector(
			'.treeview-link'
		) as HTMLDivElement;

		expect(linkItem.getAttribute('aria-expanded')).toBe('true');
		expect(container.querySelector('.collapse.show')).toBeTruthy();

		fireEvent.click(expanderButton);

		jest.runAllTimers();

		expect(linkItem.getAttribute('aria-expanded')).toBe('false');
		expect(container.querySelector('.collapse')).toBeFalsy();
	});

	describe('selection', () => {
		describe('checkbox', () => {
			it('select only one item using single selection', () => {
				const {container} = render(
					<Provider spritemap={spritemap}>
						<TreeView defaultExpandedKeys={new Set(['Root'])}>
							<TreeView.Item key="Root">
								<TreeView.ItemStack>
									<OptionalCheckbox />
									Root
								</TreeView.ItemStack>
								<TreeView.Group>
									<TreeView.Item key="Item">
										<OptionalCheckbox />
										Item
									</TreeView.Item>
								</TreeView.Group>
							</TreeView.Item>
						</TreeView>
					</Provider>
				);

				const [root, item] =
					container.querySelectorAll<HTMLInputElement>(
						'input.custom-control-input[type=checkbox]'
					);

				fireEvent.click(root);

				expect(root.checked).toBeTruthy();

				fireEvent.click(item);

				expect(item.checked).toBeTruthy();
				expect(root.checked).toBeFalsy();
			});

			it('select multiple item using multiple selection', () => {
				const {container} = render(
					<Provider spritemap={spritemap}>
						<TreeView
							defaultExpandedKeys={new Set(['Root'])}
							selectionMode="multiple"
						>
							<TreeView.Item key="Root">
								<TreeView.ItemStack>
									<OptionalCheckbox />
									Root
								</TreeView.ItemStack>
								<TreeView.Group>
									<TreeView.Item key="Item">
										<OptionalCheckbox />
										Item
									</TreeView.Item>
								</TreeView.Group>
							</TreeView.Item>
						</TreeView>
					</Provider>
				);

				const [root, item] =
					container.querySelectorAll<HTMLInputElement>(
						'input.custom-control-input[type=checkbox]'
					);

				fireEvent.click(root);
				fireEvent.click(item);

				expect(item.checked).toBeTruthy();
				expect(root.checked).toBeTruthy();
			});

			it('select children and parent recursively using recursive multiple selection', () => {
				const {container} = render(
					<Provider spritemap={spritemap}>
						<TreeView
							defaultItems={[
								{
									children: [{id: 2, name: 'Item'}],
									id: 1,
									name: 'Root',
								},
							]}
							selectionMode="multiple-recursive"
						>
							{(item) => (
								<TreeView.Item>
									<TreeView.ItemStack>
										<OptionalCheckbox />
										{item.name}
									</TreeView.ItemStack>
									<TreeView.Group items={item.children}>
										{(item) => (
											<TreeView.Item>
												<OptionalCheckbox />
												{item.name}
											</TreeView.Item>
										)}
									</TreeView.Group>
								</TreeView.Item>
							)}
						</TreeView>
					</Provider>
				);

				const rootExpander = container.querySelector(
					'.component-expander'
				) as HTMLButtonElement;

				const root = container.querySelector(
					'input.custom-control-input[type=checkbox]'
				) as HTMLInputElement;

				fireEvent.click(root);
				fireEvent.click(rootExpander);

				expect(root.checked).toBeTruthy();

				const [, item] = container.querySelectorAll<HTMLInputElement>(
					'input.custom-control-input[type=checkbox]'
				);

				expect(item.checked).toBeTruthy();
			});

			it('pressing space selects item', () => {
				const {container, getByRole} = render(
					<Provider spritemap={spritemap}>
						<TreeView>
							<TreeView.Item key="Root">
								<TreeView.ItemStack>
									<OptionalCheckbox />
									Root
								</TreeView.ItemStack>
								<TreeView.Group>
									<TreeView.Item key="Item">
										<OptionalCheckbox />
										Item
									</TreeView.Item>
								</TreeView.Group>
							</TreeView.Item>
						</TreeView>
					</Provider>
				);

				const root = getByRole('treeitem');

				const rootCheckbox = container.querySelector(
					'input.custom-control-input[type=checkbox]'
				) as HTMLInputElement;

				fireEvent.keyDown(root, {key: ' '});

				expect(rootCheckbox.checked).toBeTruthy();
			});
		});

		it('clicking the item link selects the item in the single selection', () => {
			const {getAllByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [root, item] = getAllByRole('treeitem');

			fireEvent.click(root);

			expect(root.classList).toContain('active');

			fireEvent.click(item);

			expect(item.classList).toContain('active');
			expect(root.classList).not.toContain('active');
		});

		it('trigger selection manually using single selection', () => {
			jest.useFakeTimers();

			const {getAllByRole, getByTestId} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item, selection) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
									<Button
										data-testid="root"
										onClick={() =>
											selection.toggle(item.id)
										}
									>
										Select
									</Button>
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
											<Button
												data-testid="item"
												onClick={() =>
													selection.toggle(item.id)
												}
											>
												Select
											</Button>
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			jest.runAllTimers();

			const [root, item] = getAllByRole('treeitem');

			fireEvent.click(getByTestId('root'));

			expect(root.classList).toContain('active');

			fireEvent.click(getByTestId('item'));

			expect(item.classList).toContain('active');
			expect(root.classList).not.toContain('active');
		});

		it('trigger selection manually using multiple selection', () => {
			jest.useFakeTimers();

			const {getAllByRole, getByTestId} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
						selectionMode="multiple"
					>
						{(item, selection) => (
							<TreeView.Item>
								<TreeView.ItemStack
									className={
										selection.has(item.id)
											? 'active'
											: undefined
									}
								>
									{item.name}
									<Button
										data-testid="root"
										onClick={(event) => {
											event.stopPropagation();

											selection.toggle(item.id);
										}}
									>
										Select
									</Button>
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item
											className={
												selection.has(item.id)
													? 'active'
													: undefined
											}
										>
											{item.name}
											<Button
												data-testid="item"
												onClick={(event) => {
													event.stopPropagation();

													selection.toggle(item.id);
												}}
											>
												Select
											</Button>
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			jest.runAllTimers();

			const [root, item] = getAllByRole('treeitem');

			fireEvent.click(getByTestId('root'));
			fireEvent.click(getByTestId('item'));

			expect(item.classList).toContain('active');
			expect(root.classList).toContain('active');
		});

		it('trigger selection manually using recursive multiple selection', () => {
			const {getAllByRole, getByTestId} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
						selectionMode="multiple-recursive"
					>
						{(item, selection) => (
							<TreeView.Item>
								<TreeView.ItemStack
									className={
										selection.has(item.id)
											? 'active'
											: undefined
									}
								>
									{item.name}
									<Button
										data-testid="root"
										onClick={(event) => {
											event.stopPropagation();

											selection.toggle(item.id);
										}}
									>
										Select
									</Button>
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item
											className={
												selection.has(item.id)
													? 'active'
													: undefined
											}
										>
											{item.name}
											<Button
												data-testid="item"
												onClick={(event) => {
													event.stopPropagation();

													selection.toggle(item.id);
												}}
											>
												Select
											</Button>
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [root, item] = getAllByRole('treeitem');

			fireEvent.click(getByTestId('root'));

			expect(item.classList).toContain('active');
			expect(root.classList).toContain('active');
		});
	});

	describe('focus', () => {
		it('pressing the right arrow key expands the item', () => {
			const {container, getByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const root = getByRole('treeitem');

			fireEvent.keyDown(root, {key: 'ArrowRight'});

			expect(document.activeElement).toBe(root);
			expect(root.getAttribute('aria-expanded')).toBe('true');
			expect(container.querySelector('.collapse.show')).toBeTruthy();
		});

		it('pressing the right arrow key with the expanded item moves focus to the nearest down item', () => {
			const {getAllByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [root, item] = getAllByRole('treeitem');

			fireEvent.keyDown(root, {key: 'ArrowRight'});

			expect(document.activeElement).toBe(item);
		});

		it('pressing the left arrow key hides the item', () => {
			jest.useFakeTimers();

			const {container, getByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const root = getByRole('treeitem');

			fireEvent.keyDown(root, {key: 'ArrowRight'});

			expect(root.getAttribute('aria-expanded')).toBe('true');
			expect(container.querySelector('.collapse.show')).toBeTruthy();

			fireEvent.keyDown(root, {key: 'ArrowLeft'});

			jest.runAllTimers();

			expect(root.getAttribute('aria-expanded')).toBe('false');
			expect(container.querySelector('.collapse.show')).toBeFalsy();
		});

		it('pressing the left arrow key with the item hidden moves the focus to the next item above', () => {
			const {getAllByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [
									{
										children: [{id: 3, name: 'Item 2'}],
										id: 2,
										name: 'Item',
									},
								],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [root, item] = getAllByRole('treeitem');

			fireEvent.keyDown(item, {key: 'ArrowLeft'});

			expect(document.activeElement).toBe(root);
		});

		it('pressing the down key moves focus to the nearest item', () => {
			const {container, getByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const root = getByRole('treeitem');

			fireEvent.keyDown(root, {key: 'ArrowRight'});

			expect(root.getAttribute('aria-expanded')).toBe('true');
			expect(container.querySelector('.collapse.show')).toBeTruthy();

			fireEvent.keyDown(root, {key: 'ArrowDown'});

			const group = getByRole('group');

			expect(document.activeElement).toBe(
				group.querySelector('.treeview-link')
			);
		});

		it('pressing the up key moves focus to the nearest item', () => {
			jest.useFakeTimers();

			const {getAllByRole} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [
									{id: 2, name: 'Bar'},
									{id: 3, name: 'Baz'},
								],
								id: 1,
								name: 'Foo',
							},
						]}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			jest.runAllTimers();

			const [foo, bar, baz] = getAllByRole('treeitem');

			fireEvent.keyDown(foo, {key: 'ArrowRight'});

			fireEvent.keyDown(foo, {key: 'ArrowDown'});

			fireEvent.keyDown(baz, {key: 'ArrowUp'});

			expect(document.activeElement).toBe(bar);

			fireEvent.keyDown(bar, {key: 'ArrowUp'});

			expect(document.activeElement).toBe(foo);
		});
	});

	describe('load more', () => {
		it('clicking on the item should load the children asynchronously', async () => {
			const {getAllByRole, getByText} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
						onLoadMore={async () => {
							return [
								{
									id: 3,
									name: 'Item 2',
								},
							];
						}}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [, item] = getAllByRole('treeitem');

			fireEvent.click(item);

			await waitFor(() => getByText('Item 2'));

			const [, , random] = getAllByRole('treeitem');

			expect(random).toBeTruthy();
		});

		it('pressing the right arrow key loads the item asynchronously', async () => {
			const {getAllByRole, getByText} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
						onLoadMore={async () => {
							return [
								{
									id: 3,
									name: 'Item 2',
								},
							];
						}}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [, item] = getAllByRole('treeitem');

			fireEvent.keyDown(item, {key: 'ArrowRight'});

			await waitFor(() => getByText('Item 2'));

			const [, , random] = getAllByRole('treeitem');

			expect(random).toBeTruthy();
		});

		it('loading item dynamically disable checkbox selection', async () => {
			const {container, getAllByRole, getByText} = render(
				<Provider spritemap={spritemap}>
					<TreeView
						defaultExpandedKeys={new Set([1])}
						defaultItems={[
							{
								children: [{id: 2, name: 'Item'}],
								id: 1,
								name: 'Root',
							},
						]}
						onLoadMore={async () => {
							return [
								{
									id: 3,
									name: 'Item 2',
								},
							];
						}}
					>
						{(item) => (
							<TreeView.Item>
								<TreeView.ItemStack>
									{item.name}
								</TreeView.ItemStack>
								<TreeView.Group items={item.children}>
									{(item) => (
										<TreeView.Item>
											<OptionalCheckbox />
											{item.name}
										</TreeView.Item>
									)}
								</TreeView.Group>
							</TreeView.Item>
						)}
					</TreeView>
				</Provider>
			);

			const [, item] = getAllByRole('treeitem');

			fireEvent.click(item);

			expect(
				container.querySelectorAll(
					'input.custom-control-input[type=checkbox]:disabled'
				).length
			).toBe(1);
			expect(container.querySelector('.loading-animation')).toBeTruthy();

			await waitFor(() => getByText('Item 2'));

			const [, , random] = getAllByRole('treeitem');

			expect(random).toBeTruthy();
		});
	});
});
