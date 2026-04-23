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

public class AllowStudents extends BrowserDriver {

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

    public static void clickAllowStudentsNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-allow"));
        navBtn.click();
        Thread.sleep(2000);

        waitForVisible(By.id("dropdown_subject_filter_allow_students"));
        waitForVisible(By.id("input_search_exam_allow_students"));
    }

    public static void filterAllowStudentsPageBySubject() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.id("dropdown_subject_filter_allow_students"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        List<WebElement> options = subjectSelect.getOptions();

        if (options.size() > 1) {
            subjectSelect.selectByIndex(1);
            Thread.sleep(1500);
        }
    }

    public static void searchExamsInAllowStudentsPage() throws InterruptedException {
        WebElement searchInput = waitForVisible(By.id("input_search_exam_allow_students"));
        scrollIntoView(searchInput);

        clearInput(searchInput);
        searchInput.sendKeys("IT");
        Thread.sleep(1500);
    }

    public static void clearAllowStudentsFilters() throws InterruptedException {
        WebElement clearBtn = waitForClickable(By.id("btn_clear_filters_allow_students"));
        scrollIntoView(clearBtn);
        clearBtn.click();
        Thread.sleep(1500);
    }

    public static boolean areAllowStudentsFiltersWorkingSuccessfully() {
        try {
            WebElement subjectSelectElement = waitForVisible(By.id("dropdown_subject_filter_allow_students"));
            Select subjectSelect = new Select(subjectSelectElement);

            WebElement searchInput = waitForVisible(By.id("input_search_exam_allow_students"));

            boolean subjectReset = subjectSelect.getFirstSelectedOption().getAttribute("value").equals("all");
            boolean searchReset = searchInput.getAttribute("value").isEmpty();

            return subjectReset && searchReset;
        } catch (Exception e) {
            return false;
        }
    }

    public static void refreshAllowStudentsPage() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.id("btn_refresh_allow_students"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isAllowStudentsRefreshWorkingSuccessfully() {
        try {
            return waitForVisible(By.id("btn_refresh_allow_students")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public static void clickFirstManageStudentsButton() throws InterruptedException {
        List<WebElement> manageButtons = driver.findElements(
                By.cssSelector("button[id^='btn_manage_students_']")
        );

        if (manageButtons.isEmpty()) {
            throw new RuntimeException("No Manage Students button found");
        }

        WebElement firstManageBtn = manageButtons.get(0);
        scrollIntoView(firstManageBtn);
        firstManageBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isManageStudentsModalOpenedSuccessfully() {
        try {
            boolean titleVisible = driver.findElements(By.id("ms_modal_title")).size() > 0;
            boolean closeBtnVisible = driver.findElements(By.id("btn_close_manage_students_modal")).size() > 0;
            boolean passwordInputVisible = driver.findElements(By.id("ms_input_password")).size() > 0;

            return titleVisible && closeBtnVisible && passwordInputVisible;
        } catch (Exception e) {
            return false;
        }
    }

    public static void closeManageStudentsModal() throws InterruptedException {
        WebElement closeBtn = waitForClickable(By.id("btn_close_manage_students_modal"));
        scrollIntoView(closeBtn);
        closeBtn.click();
        Thread.sleep(1500);
    }

    public static boolean isManageStudentsModalClosedSuccessfully() {
        try {
            return driver.findElements(By.id("ms_modal_title")).isEmpty()
                    && waitForVisible(By.id("btn_refresh_allow_students")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}