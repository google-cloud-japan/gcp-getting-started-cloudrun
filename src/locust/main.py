# -*- coding: utf-8 -*-

# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import random

from locust import HttpUser, task, between


default_headers = {'Content-Type': 'application/json'}


class WebsiteUser(HttpUser):
    wait_time = between(1, 2)

    @task(3)
    def get_sum(self):
        self.client.post("/sum", data=json.dumps({"numbers": random_number_list()}), headers=default_headers)
    
    @task(1)
    def get_sumcurrecy(self):
        self.client.post("/sumcurrency", data=json.dumps({"amounts": random_currency_list()}), headers=default_headers)


def random_number_list():
    return [random.randrange(200) for i in range(random.randrange(1, 4))]


def random_currency_list():
    return [random_currency() + str(random.randrange(200)) for i in range(random.randrange(1, 4))]


def random_currency():
    currencies = ["JPY", "USD", "EUR", "BRL", "AUD"]
    return currencies[random.randrange(len(currencies))]
