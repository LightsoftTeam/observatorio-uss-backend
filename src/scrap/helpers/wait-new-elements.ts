import { Page } from "playwright";

type Params = {
    page: Page,
    initialCount: number,
    selector: string,
}

export async function waitNewElements({ page, initialCount, selector }: Params) {
    return page.waitForFunction(
        ({ initialCount, selector }) => {
            const newCount = document.querySelectorAll(selector).length;
            return newCount > initialCount;
        },
        {
            initialCount,
            selector
        },
    )
}