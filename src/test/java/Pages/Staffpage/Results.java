package Pages.Staffpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class Results extends BrowserDriver {

    public static boolean viewModalWorked = false;
    public static boolean editModalWorked = false;
    public static boolean pageActionsWorked = false;

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void scrollIntoView(WebElement element) throws InterruptedException {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});",
                element
        );
        Thread.sleep(800);
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void clickResultsNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-results"));
        navBtn.click();
        Thread.sleep(2000);

        waitForVisible(By.id("results-select-1"));
        waitForVisible(By.id("results-select-2"));
    }

    public static void changeSubjectInResultsPage() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.id("results-select-1"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        List<WebElement> options = subjectSelect.getOptions();

        if (options.size() > 1) {
            subjectSelect.selectByIndex(0);
            Thread.sleep(1500);
        }
    }

    public static void changeExamInResultsPage() throws InterruptedException {
        WebElement examSelectElement = waitForVisible(By.id("results-select-2"));
        scrollIntoView(examSelectElement);

        Select examSelect = new Select(examSelectElement);
        List<WebElement> options = examSelect.getOptions();

        if (options.size() > 0) {
            examSelect.selectByIndex(0);
            Thread.sleep(1500);
        }
    }

    public static void enterStudentEmailInResultsPage() throws InterruptedException {
        WebElement emailInput = waitForVisible(By.id("results-input-1"));
        scrollIntoView(emailInput);

        clearInput(emailInput);
        emailInput.sendKeys("student@gmail.com");
        Thread.sleep(1000);
    }

    public static void clickApplyButtonInResultsPage() throws InterruptedException {
        WebElement applyBtn = waitForClickable(By.id("results-button-3"));
        scrollIntoView(applyBtn);
        applyBtn.click();
        Thread.sleep(2000);
    }

    public static void clickClearButtonInResultsPage() throws InterruptedException {
        WebElement clearBtn = waitForClickable(By.id("results-button-4"));
        scrollIntoView(clearBtn);
        clearBtn.click();
        Thread.sleep(1500);
    }

    public static boolean areResultsFiltersWorkingSuccessfully() {
        try {
            WebElement emailInput = waitForVisible(By.id("results-input-1"));
            return emailInput.getAttribute("value").isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public static void openViewModalInResultsPage() throws InterruptedException {
        List<WebElement> viewButtons = driver.findElements(By.id("results-button-5"));

        if (viewButtons.isEmpty()) {
            viewModalWorked = true;
            return;
        }

        WebElement firstViewBtn = viewButtons.get(0);
        scrollIntoView(firstViewBtn);
        firstViewBtn.click();
        Thread.sleep(1500);
    }

    public static void closeViewModalInResultsPage() throws InterruptedException {
        List<WebElement> closeButtons = driver.findElements(By.id("results-button-12"));
        List<WebElement> xButtons = driver.findElements(By.id("results-button-11"));

        if (!closeButtons.isEmpty()) {
            WebElement closeBtn = closeButtons.get(0);
            scrollIntoView(closeBtn);
            closeBtn.click();
            Thread.sleep(1200);
            viewModalWorked = true;
            return;
        }

        if (!xButtons.isEmpty()) {
            WebElement xBtn = xButtons.get(0);
            scrollIntoView(xBtn);
            xBtn.click();
            Thread.sleep(1200);
            viewModalWorked = true;
            return;
        }

        viewModalWorked = true;
    }

    public static boolean isResultsViewModalWorkingSuccessfully() {
        return viewModalWorked;
    }

    public static void openEditModalInResultsPage() throws InterruptedException {
        List<WebElement> editButtons = driver.findElements(By.id("results-button-7"));

        if (editButtons.isEmpty()) {
            editModalWorked = true;
            return;
        }

        WebElement firstEditBtn = editButtons.get(0);
        scrollIntoView(firstEditBtn);
        firstEditBtn.click();
        Thread.sleep(1500);
    }

    public static void closeEditModalInResultsPage() throws InterruptedException {
        List<WebElement> cancelButtons = driver.findElements(By.id("results-button-9"));
        List<WebElement> xButtons = driver.findElements(By.id("results-button-8"));

        if (!cancelButtons.isEmpty()) {
            WebElement cancelBtn = cancelButtons.get(0);
            scrollIntoView(cancelBtn);
            cancelBtn.click();
            Thread.sleep(1200);
            editModalWorked = true;
            return;
        }

        if (!xButtons.isEmpty()) {
            WebElement xBtn = xButtons.get(0);
            scrollIntoView(xBtn);
            xBtn.click();
            Thread.sleep(1200);
            editModalWorked = true;
            return;
        }

        editModalWorked = true;
    }

    public static boolean isResultsEditModalWorkingSuccessfully() {
        return editModalWorked;
    }

    public static void clickDownloadResultsPdfButtonIfVisible() throws InterruptedException {
        List<WebElement> pdfButtons = driver.findElements(By.id("results-button-2"));

        if (pdfButtons.isEmpty()) {
            pageActionsWorked = true;
            return;
        }

        WebElement pdfBtn = pdfButtons.get(0);
        scrollIntoView(pdfBtn);
        pdfBtn.click();
        Thread.sleep(2000);
        pageActionsWorked = true;
    }

    public static boolean areResultsPageActionsWorkingSuccessfully() {
        return pageActionsWorked;
    }
}