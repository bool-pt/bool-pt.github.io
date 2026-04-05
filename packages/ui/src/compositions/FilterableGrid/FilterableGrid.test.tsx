import { render, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import FilterableGrid from './FilterableGrid';

afterEach(cleanup);

interface Item {
  name: string;
  category: string;
}

const testData: Item[] = [
  { name: 'Alpha', category: 'A' },
  { name: 'Beta', category: 'B' },
  { name: 'Charlie', category: 'A' },
];

const filterGroups = [
  { items: ['All', 'Category A', 'Category B'], ariaLabel: 'Filter by category' },
];

function matchFilter(item: Item, _groupIndex: number, activeIndex: number): boolean {
  if (activeIndex === 0) return true;
  if (activeIndex === 1) return item.category === 'A';
  if (activeIndex === 2) return item.category === 'B';
  return true;
}

function renderItem(item: Item) {
  return <div key={item.name} data-testid={`item-${item.name}`}>{item.name}</div>;
}

describe('FilterableGrid', () => {
  it('renders all items by default', () => {
    const { container } = render(
      <FilterableGrid
        data={testData}
        filterGroups={filterGroups}
        matchFilter={matchFilter}
        renderItem={renderItem}
      />,
    );
    const scope = within(container);

    expect(scope.getByTestId('item-Alpha')).toBeInTheDocument();
    expect(scope.getByTestId('item-Beta')).toBeInTheDocument();
    expect(scope.getByTestId('item-Charlie')).toBeInTheDocument();
  });

  it('filters items when a filter is selected', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FilterableGrid
        data={testData}
        filterGroups={filterGroups}
        matchFilter={matchFilter}
        renderItem={renderItem}
      />,
    );
    const scope = within(container);

    await user.click(scope.getByRole('tab', { name: 'Category A' }));

    expect(scope.getByTestId('item-Alpha')).toBeInTheDocument();
    expect(scope.getByTestId('item-Charlie')).toBeInTheDocument();
    expect(scope.queryByTestId('item-Beta')).not.toBeInTheDocument();
  });

  it('shows empty message when no items match', async () => {
    const user = userEvent.setup();
    const emptyFilter = [
      { items: ['All', 'None'], ariaLabel: 'Filter' },
    ];

    const { container } = render(
      <FilterableGrid
        data={testData}
        filterGroups={emptyFilter}
        matchFilter={(_item, _gi, activeIndex) => activeIndex === 0}
        renderItem={renderItem}
        emptyMessage="No results found"
      />,
    );
    const scope = within(container);

    await user.click(scope.getByRole('tab', { name: 'None' }));
    expect(scope.getByText('No results found')).toBeInTheDocument();
  });

  it('marks active filter with aria-selected', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FilterableGrid
        data={testData}
        filterGroups={filterGroups}
        matchFilter={matchFilter}
        renderItem={renderItem}
      />,
    );
    const scope = within(container);

    const allTab = scope.getByRole('tab', { name: 'All' });
    expect(allTab).toHaveAttribute('aria-selected', 'true');

    await user.click(scope.getByRole('tab', { name: 'Category B' }));
    expect(allTab).toHaveAttribute('aria-selected', 'false');
    expect(scope.getByRole('tab', { name: 'Category B' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('supports toggle mode for filter groups', async () => {
    const user = userEvent.setup();
    const toggleGroups = [
      { items: ['Tag A', 'Tag B'], ariaLabel: 'Tags', toggle: true },
    ];

    const { container } = render(
      <FilterableGrid
        data={testData}
        filterGroups={toggleGroups}
        matchFilter={(item: Item, _gi, activeIndex) => {
          if (activeIndex === -1) return true;
          if (activeIndex === 0) return item.category === 'A';
          return item.category === 'B';
        }}
        renderItem={renderItem}
      />,
    );
    const scope = within(container);

    // Initially all items shown (toggle off = -1)
    expect(scope.getByTestId('item-Alpha')).toBeInTheDocument();
    expect(scope.getByTestId('item-Beta')).toBeInTheDocument();

    // Click to activate toggle
    await user.click(scope.getByRole('tab', { name: 'Tag A' }));
    expect(scope.getByTestId('item-Alpha')).toBeInTheDocument();
    expect(scope.queryByTestId('item-Beta')).not.toBeInTheDocument();

    // Click again to deactivate toggle
    await user.click(scope.getByRole('tab', { name: 'Tag A' }));
    expect(scope.getByTestId('item-Beta')).toBeInTheDocument();
  });

  it('renders filter group with correct aria-label', () => {
    const { container } = render(
      <FilterableGrid
        data={testData}
        filterGroups={filterGroups}
        matchFilter={matchFilter}
        renderItem={renderItem}
        ariaLabel="Portfolio grid"
      />,
    );
    const scope = within(container);

    expect(scope.getByRole('group', { name: 'Portfolio grid' })).toBeInTheDocument();
    expect(scope.getByRole('tablist', { name: 'Filter by category' })).toBeInTheDocument();
  });
});
