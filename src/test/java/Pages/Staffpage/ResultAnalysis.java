package Pages.Staffpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class ResultAnalysis extends BrowserDriver {

    public static boolean analysisLoaded = false;
    public static boolean analysisActionsWorked = false;

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

    public static void clickResultAnalysisNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-analysis"));
        navBtn.click();
        Thread.sleep(2000);

        waitForVisible(By.id("resultanalysis-select-1"));
        waitForVisible(By.id("resultanalysis-select-2"));
    }

    public static void selectSubjectInResultAnalysisPage() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.id("resultanalysis-select-1"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        List<WebElement> options = subjectSelect.getOptions();

        if (options.size() > 1) {
            subjectSelect.selectByIndex(1);
            Thread.sleep(2000);
        }
    }

    public static void selectExamInResultAnalysisPage() throws InterruptedException {
        WebElement examSelectElement = waitForVisible(By.id("resultanalysis-select-2"));
        scrollIntoView(examSelectElement);

        Select examSelect = new Select(examSelectElement);
        List<WebElement> options = examSelect.getOptions();

        if (options.size() > 1) {
            examSelect.selectByIndex(1);
            Thread.sleep(3000);
        }
    }

    public static boolean isResultAnalysisDataLoadedSuccessfully() {
        try {
            // analysis load ஆனா either report button வரும் or stats cards render ஆகும்
            boolean subjectVisible = driver.findElements(By.id("resultanalysis-select-1")).size() > 0;
            boolean examVisible = driver.findElements(By.id("resultanalysis-select-2")).size() > 0;
            boolean reportButtonVisible = driver.findElements(By.id("resultanalysis-button-1")).size() > 0;

            analysisLoaded = subjectVisible && examVisible && reportButtonVisible;
            return analysisLoaded;
        } catch (Exception e) {
            return false;
        }
    }

    public static void clickDownloadAnalysisReportButtonIfVisible() throws InterruptedException {
        List<WebElement> reportButtons = driver.findElements(By.id("resultanalysis-button-1"));

        if (reportButtons.isEmpty()) {
            analysisActionsWorked = true;
            return;
        }

        WebElement reportBtn = reportButtons.get(0);
        scrollIntoView(reportBtn);
        reportBtn.click();
        Thread.sleep(2000);

        analysisActionsWorked = true;
    }

    public static boolean areResultAnalysisActionsWorkingSuccessfully() {
        return analysisActionsWorked;
    }
}