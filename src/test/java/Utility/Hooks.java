package Utility;

import io.cucumber.java.After;

public class Hooks extends BrowserDriver {

    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
            driver = null; // 🔥 VERY IMPORTANT
        }
    }
}