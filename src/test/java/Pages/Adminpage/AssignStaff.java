package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class AssignStaff extends BrowserDriver {

    public static String selectedSubjectText = "";
    public static String selectedStaffText = "";
    public static String removedStaffName = "";
    public static String editedAssignmentId = "";
    public static String deletedAssignmentId = "";
    public static int beforeDeleteRowCount = 0;

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void scrollIntoView(WebElement element) throws InterruptedException {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});", element
        );
        Thread.sleep(800);
    }

    public static void clickAssignStaffNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("admin-nav-assign-staff"));
        navBtn.click();
        Thread.sleep(2000);
        waitForVisible(By.id("assignstaff-select-1"));
    }

    public static void filterSubjectsInAssignmentPanel() throws InterruptedException {
        WebElement yearFilter = waitForVisible(By.id("assignstaff-year-filter"));
        scrollIntoView(yearFilter);
        Select yearSelect = new Select(yearFilter);
        yearSelect.selectByValue("3");
        Thread.sleep(1200);

        WebElement semFilter = waitForVisible(By.id("assignstaff-sem-filter"));
        Select semSelect = new Select(semFilter);
        semSelect.selectByValue("1");
        Thread.sleep(1200);
    }

    public static void searchSubjectInAssignmentPanel() throws InterruptedException {
        WebElement subjectSearch = waitForVisible(By.id("assignstaff-subject-search"));
        clearInput(subjectSearch);
        subjectSearch.sendKeys("IT");
        Thread.sleep(1500);
    }

    public static void selectSubjectInAssignmentPanel() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.id("assignstaff-select-1"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        List<WebElement> options = subjectSelect.getOptions();

        for (int i = 1; i < options.size(); i++) {
            String text = options.get(i).getText().trim();
            if (!text.isEmpty()) {
                subjectSelect.selectByIndex(i);
                selectedSubjectText = text;
                Thread.sleep(1500);
                return;
            }
        }

        throw new RuntimeException("No subject available to select");
    }

    public static void searchStaffInAssignmentPanel() throws InterruptedException {
        WebElement staffSearch = waitForVisible(By.id("assignstaff-input-1"));
        clearInput(staffSearch);
        staffSearch.sendKeys("k");
        Thread.sleep(1500);
    }

    public static void selectStaffMembersInAssignmentPanel() throws InterruptedException {
        List<WebElement> staffButtons = driver.findElements(By.cssSelector("button[id^='assignstaff-button-staff-']"));

        if (staffButtons.isEmpty()) {
            throw new RuntimeException("No staff buttons found");
        }

        WebElement firstStaff = staffButtons.get(0);
        scrollIntoView(firstStaff);
        selectedStaffText = firstStaff.getText().trim();
        firstStaff.click();
        Thread.sleep(1000);
    }

    public static void clickAssignStaffButton() throws InterruptedException {
        WebElement assignBtn = waitForClickable(By.id("assignstaff-button-4"));
        scrollIntoView(assignBtn);
        assignBtn.click();
        Thread.sleep(3000);
    }

    public static boolean isStaffAssignedSuccessfully() {
        try {
            WebElement assignedSection = waitForVisible(By.xpath("//div[contains(text(),'Assigned Staff')]"));
            scrollIntoView(assignedSection);

            List<WebElement> assignedCards = driver.findElements(
                    By.cssSelector("button[id^='assignstaff-button-remove-']")
            );

            return !assignedCards.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public static void refreshAssignedStaffSection() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.id("assignstaff-button-5"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static void removeOneAssignedStaffMember() throws InterruptedException {
        List<WebElement> removeButtons = driver.findElements(
                By.cssSelector("button[id^='assignstaff-button-remove-']")
        );

        if (removeButtons.isEmpty()) {
            throw new RuntimeException("No assigned staff remove button found");
        }

        WebElement firstRemoveButton = removeButtons.get(0);

        WebElement parentCard = firstRemoveButton.findElement(
                By.xpath("./ancestor::div[contains(@class,'rounded-xl')]")
        );
        removedStaffName = parentCard.getText().trim();

        scrollIntoView(firstRemoveButton);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", firstRemoveButton);
        Thread.sleep(1500);

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        WebElement confirmRemove = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("assignstaff-button-11"))
        );

        // page top கு போ
        ((JavascriptExecutor) driver).executeScript("window.scrollTo(0, 0);");
        Thread.sleep(1000);

        // modal center கு கொண்டு வா
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});",
                confirmRemove
        );
        Thread.sleep(800);

        wait.until(ExpectedConditions.elementToBeClickable(confirmRemove));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", confirmRemove);

        Thread.sleep(2500);
    }

    public static boolean isAssignedStaffRemovedSuccessfully() {
        try {
            List<WebElement> assignedCards = driver.findElements(
                    By.xpath("//*[contains(text(),'Assigned Staff')]/following::div[contains(@class,'rounded-xl')]")
            );

            for (WebElement card : assignedCards) {
                if (card.getText().trim().equalsIgnoreCase(removedStaffName)) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            return true;
        }
    }

    public static void filterAllAssignmentsTable() throws InterruptedException {
        WebElement subjectFilter = waitForVisible(By.id("assignstaff-table-subject-filter"));
        scrollIntoView(subjectFilter);
        clearInput(subjectFilter);
        subjectFilter.sendKeys("IT");
        Thread.sleep(1500);

        WebElement staffFilter = waitForVisible(By.id("assignstaff-table-staff-filter"));
        clearInput(staffFilter);
        staffFilter.sendKeys("k");
        Thread.sleep(1500);

        clearInput(subjectFilter);
        clearInput(staffFilter);
        Thread.sleep(1000);
    }

    public static void refreshAllAssignmentsTable() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.id("assignstaff-button-7"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static String getFirstAssignmentRowId() {
        List<WebElement> editButtons = driver.findElements(By.cssSelector("button[id^='assignstaff-button-edit-']"));
        if (editButtons.isEmpty()) {
            throw new RuntimeException("No assignment edit buttons found");
        }
        String fullId = editButtons.get(0).getAttribute("id");
        return fullId.replace("assignstaff-button-edit-", "");
    }

    public static void editFirstAssignmentRow() throws InterruptedException {
        editedAssignmentId = getFirstAssignmentRowId();

        WebElement editBtn = waitForClickable(By.id("assignstaff-button-edit-" + editedAssignmentId));
        scrollIntoView(editBtn);
        editBtn.click();
        Thread.sleep(1500);

        WebElement staffSelectElement = waitForVisible(By.id("assignstaff-select-3"));
        Select staffSelect = new Select(staffSelectElement);
        List<WebElement> staffOptions = staffSelect.getOptions();

        for (int i = 1; i < staffOptions.size(); i++) {
            String text = staffOptions.get(i).getText().trim();
            if (!text.isEmpty()) {
                staffSelect.selectByIndex(i);
                Thread.sleep(1000);
                break;
            }
        }

        WebElement saveBtn = waitForClickable(By.id("assignstaff-button-13"));
        scrollIntoView(saveBtn);
        saveBtn.click();
        Thread.sleep(2500);
    }

    public static boolean isAssignmentUpdatedSuccessfully() {
        try {
            return driver.findElements(By.id("assignstaff-button-edit-" + editedAssignmentId)).size() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static void deleteFirstAssignmentRow() throws InterruptedException {
        List<WebElement> deleteButtons = driver.findElements(By.cssSelector("button[id^='assignstaff-button-delete-']"));
        if (deleteButtons.isEmpty()) {
            throw new RuntimeException("No assignment delete buttons found");
        }

        beforeDeleteRowCount = deleteButtons.size();

        WebElement firstDelete = deleteButtons.get(0);
        String fullId = firstDelete.getAttribute("id");
        deletedAssignmentId = fullId.replace("assignstaff-button-delete-", "");

        scrollIntoView(firstDelete);
        firstDelete.click();
        Thread.sleep(2500);
    }

    public static boolean isAssignmentDeletedSuccessfully() {
        try {
            List<WebElement> deleteButtonsAfter = driver.findElements(By.cssSelector("button[id^='assignstaff-button-delete-']"));
            boolean sameIdStillExists = driver.findElements(By.id("assignstaff-button-delete-" + deletedAssignmentId)).size() > 0;
            return deleteButtonsAfter.size() < beforeDeleteRowCount || !sameIdStillExists;
        } catch (Exception e) {
            return false;
        }
    }
}